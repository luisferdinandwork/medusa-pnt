"use server"

import { sdk } from "@lib/config"
import medusaError from "@lib/util/medusa-error"
import {
  cartFulfillment,
  cartQuantityKey,
  hasUnits,
  lineFulfillment,
  lineItemLocationMetadata,
  lineLocationId,
  locationStockMessage,
  unitsAt,
  type FulfillmentMode,
  type OmnichannelData,
  type StockLocationOption,
} from "@lib/util/omnichannel"
import { isInsufficientInventoryError } from "@lib/util/stock"
import { getOmnichannelAvailability } from "./omnichannel"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { redirect } from "next/navigation"
import {
  getAuthHeaders,
  getCacheOptions,
  getCacheTag,
  getCartId,
  removeCartId,
  setCartId,
} from "./cookies"
import { getRegion } from "./regions"
import { getLocale } from "./locale-actions"

/**
 * Retrieves a cart by its ID. If no ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to retrieve.
 * @returns The cart object if found, or null if not found.
 */
export async function retrieveCart(cartId?: string, fields?: string) {
  const id = cartId || (await getCartId())
  fields ??=
    "*items, *region, *items.product, *items.variant, *items.thumbnail, *items.metadata, +items.total, *promotions, +shipping_methods.name"

  if (!id) {
    return null
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("carts")),
  }

  return await sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${id}`, {
      method: "GET",
      query: {
        fields,
      },
      headers,
      next,
      cache: "force-cache",
    })
    .then(({ cart }: { cart: HttpTypes.StoreCart }) => cart)
    .catch(() => null)
}

export async function getOrSetCart(countryCode: string) {
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  let cart = await retrieveCart(undefined, "id,region_id")

  const headers = {
    ...(await getAuthHeaders()),
  }

  if (!cart) {
    const locale = await getLocale()
    const cartResp = await sdk.store.cart.create(
      { region_id: region.id, locale: locale || undefined },
      {},
      headers
    )
    cart = cartResp.cart

    await setCartId(cart.id)

    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  if (cart && cart?.region_id !== region.id) {
    await sdk.store.cart.update(cart.id, { region_id: region.id }, {}, headers)
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  return cart
}

export async function updateCart(data: HttpTypes.StoreUpdateCart) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found, please create one before updating")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, data, {}, headers)
    .then(async ({ cart }: { cart: HttpTypes.StoreCart }) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)

      return cart
    })
    .catch(medusaError)
}

// Cart actions called from client components return their error instead of
// throwing it: Next.js replaces the message of an error thrown from a server
// action with a generic one in production, so the shopper would never see it.
export type CartActionResult = { success: true } | { success: false; error: string }

const GENERIC_CART_ERROR = "Tas belanja gagal diperbarui. Coba lagi sebentar lagi."

type CartLine = {
  id: string
  variant_id: string | null
  quantity: number
  metadata?: Record<string, unknown> | null
  product_title?: string | null
  variant_title?: string | null
}

const retrieveCartLines = async (): Promise<CartLine[]> => {
  const cart = await retrieveCart(
    undefined,
    "id,items.id,items.variant_id,items.quantity,items.metadata,items.product_title,items.variant_title"
  )
  return (cart?.items ?? []) as CartLine[]
}

/** How the current bag is received, for the product page and the cart. */
export async function getCartFulfillment(
  locations: StockLocationOption[]
): Promise<{ mode: FulfillmentMode | null; pickupLocationId?: string; count: number }> {
  const lines = await retrieveCartLines()
  return { ...cartFulfillment(lines, locations), count: lines.length }
}

/**
 * Quantity already in the cart per variant and ship-from location, keyed by
 * `cartQuantityKey`. Lines without a location count towards the default one.
 */
export async function getCartLocationQuantities(
  locations: StockLocationOption[]
): Promise<Record<string, number>> {
  const quantities: Record<string, number> = {}

  for (const line of await retrieveCartLines()) {
    const locationId = lineLocationId(line.metadata, locations)
    if (line.variant_id && locationId) {
      const key = cartQuantityKey(line.variant_id, locationId)
      quantities[key] = (quantities[key] ?? 0) + line.quantity
    }
  }

  return quantities
}

// Units of `variantId` in other lines shipping from `locationId`.
const unitsInOtherLines = (
  lines: CartLine[],
  locations: StockLocationOption[],
  variantId: string,
  locationId: string,
  excludeLineId?: string
) =>
  lines
    .filter(
      (line) =>
        line.id !== excludeLineId &&
        line.variant_id === variantId &&
        lineLocationId(line.metadata, locations) === locationId
    )
    .reduce((sum, line) => sum + line.quantity, 0)

/**
 * Checks that `locationId` can ship `quantity` more units of the variant on
 * top of `inOtherLines`; returns the shopper-facing reason when it can't.
 */
const checkLocationStock = (
  omnichannel: OmnichannelData,
  variantId: string,
  locationId: string,
  quantity: number,
  inOtherLines: number
) => {
  const location = omnichannel.locations.find((entry) => entry.id === locationId)
  if (!location) {
    return "Lokasi pengiriman ini tidak tersedia. Pilih lokasi lain."
  }
  const units = unitsAt(omnichannel.availability, variantId, locationId)
  if (hasUnits(units, inOtherLines + quantity)) {
    return null
  }
  // Suggest another location that can take the whole request.
  const alternative = omnichannel.locations.find(
    (entry) =>
      entry.id !== locationId &&
      hasUnits(unitsAt(omnichannel.availability, variantId, entry.id), quantity)
  )
  return locationStockMessage(location, units ?? 0, inOtherLines, alternative)
}

// The hook on the backend rejects with a ready-made Indonesian sentence
// ("Stok ukuran ini di ... tinggal 2."); Medusa's own check with its English one.
const LOCATION_STOCK_ERROR = /^Stok ukuran ini di |^Lokasi pengiriman/

const cartErrorMessage = (error: unknown) =>
  error instanceof Error && LOCATION_STOCK_ERROR.test(error.message)
    ? error.message
    : isInsufficientInventoryError(error)
    ? "Stok ukuran ini baru saja berubah. Muat ulang halaman untuk melihat stok terbaru."
    : GENERIC_CART_ERROR

const revalidateCart = async () => {
  const cartCacheTag = await getCacheTag("carts")
  revalidateTag(cartCacheTag)

  const fulfillmentCacheTag = await getCacheTag("fulfillment")
  revalidateTag(fulfillmentCacheTag)
}

const lineName = (line: CartLine) =>
  [line.product_title, line.variant_title].filter(Boolean).join(" ")

/**
 * Puts every line of the bag on one receive mode. Pickup: all lines move to
 * `locationId` (a store), merging lines of the same size; refused with the
 * products the store can't cover when its stock is short (`extra` counts the
 * item about to be added). Delivery: pickup lines keep their store as the
 * ship-from location.
 */
const convertCartLines = async ({
  cartId,
  lines,
  omnichannel,
  mode,
  locationId,
  extra,
}: {
  cartId: string
  lines: CartLine[]
  omnichannel: OmnichannelData
  mode: FulfillmentMode
  locationId?: string
  extra?: { variantId: string; quantity: number }
}): Promise<string | null> => {
  const { locations, availability } = omnichannel
  const headers = { ...(await getAuthHeaders()) }

  if (mode === "delivery") {
    for (const line of lines) {
      if (lineFulfillment(line.metadata) !== "pickup") {
        continue
      }
      const location = locations.find(
        (entry) => entry.id === lineLocationId(line.metadata, locations)
      )
      if (!location) {
        continue
      }
      await sdk.store.cart.updateLineItem(
        cartId,
        line.id,
        { quantity: line.quantity, metadata: lineItemLocationMetadata(location, "delivery") },
        {},
        headers
      )
    }
    return null
  }

  const store = locations.find((entry) => entry.id === locationId)
  if (!store || store.kind !== "store") {
    return "Pilih toko untuk mengambil pesanan."
  }

  // Everything in the bag, plus the item being added, has to be at the store.
  const needed = new Map<string, { units: number; names: string[] }>()
  for (const line of lines) {
    if (!line.variant_id) {
      continue
    }
    const entry = needed.get(line.variant_id) ?? { units: 0, names: [] }
    entry.units += line.quantity
    entry.names.push(lineName(line))
    needed.set(line.variant_id, entry)
  }
  if (extra) {
    const entry = needed.get(extra.variantId) ?? { units: 0, names: [] }
    entry.units += extra.quantity
    needed.set(extra.variantId, entry)
  }
  const short = Array.from(needed.entries())
    .filter(([variantId, entry]) => !hasUnits(unitsAt(availability, variantId, store.id), entry.units))
    .flatMap(([variantId, entry]) =>
      entry.names.length ? entry.names : [variantId === extra?.variantId ? "produk ini" : ""]
    )
    .filter(Boolean)
  if (short.length) {
    return `Tidak bisa diambil di ${store.name}: ${Array.from(new Set(short)).join(", ")} tidak cukup stok di sana. Pilih toko lain, hapus produk itu, atau pilih dikirim.`
  }

  const pickupMeta = lineItemLocationMetadata(store, "pickup")
  const kept = new Map<string, CartLine>()
  // Lines already picked up at the store stay; the others join them.
  for (const line of lines) {
    if (
      line.variant_id &&
      lineFulfillment(line.metadata) === "pickup" &&
      lineLocationId(line.metadata, locations) === store.id
    ) {
      kept.set(line.variant_id, line)
    }
  }
  for (const line of lines) {
    if (!line.variant_id || kept.get(line.variant_id)?.id === line.id) {
      continue
    }
    const target = kept.get(line.variant_id)
    if (target) {
      target.quantity += line.quantity
      await sdk.store.cart.updateLineItem(cartId, target.id, { quantity: target.quantity }, {}, headers)
      await sdk.store.cart.deleteLineItem(cartId, line.id, {}, headers)
    } else {
      await sdk.store.cart.updateLineItem(
        cartId,
        line.id,
        { quantity: line.quantity, metadata: pickupMeta },
        {},
        headers
      )
      kept.set(line.variant_id, line)
    }
  }
  return null
}

/**
 * Switches the whole bag between delivery and pickup at one store, from the
 * cart page.
 */
export async function setCartFulfillment({
  mode,
  locationId,
}: {
  mode: FulfillmentMode
  locationId?: string
}): Promise<CartActionResult> {
  const cartId = await getCartId()
  if (!cartId) {
    return { success: false, error: GENERIC_CART_ERROR }
  }
  try {
    const lines = await retrieveCartLines()
    const omnichannel = await getOmnichannelAvailability(
      lines.map((line) => line.variant_id ?? "")
    )
    const problem = await convertCartLines({ cartId, lines, omnichannel, mode, locationId })
    if (problem) {
      return { success: false, error: problem }
    }
    await revalidateCart()
    return { success: true }
  } catch (error) {
    console.error("Set cart fulfillment failed:", error)
    return { success: false, error: cartErrorMessage(error) }
  }
}

export async function addToCart({
  variantId,
  quantity,
  countryCode,
  locationId,
  fulfillment = "delivery",
}: {
  variantId: string
  quantity: number
  countryCode: string
  /** Stock location to ship from; omitted when no omnichannel data loaded. */
  locationId?: string
  /** Pickup moves the whole bag to that store; delivery ships from it. */
  fulfillment?: FulfillmentMode
}): Promise<CartActionResult> {
  if (!variantId) {
    return { success: false, error: "Pilih ukuran terlebih dahulu." }
  }

  try {
    const cart = await getOrSetCart(countryCode)

    if (!cart) {
      return { success: false, error: GENERIC_CART_ERROR }
    }

    let metadata: Record<string, unknown> | undefined
    if (locationId) {
      // Checked here first so the shopper gets exact numbers and a suggestion;
      // the backend hook repeats the check before the line is saved.
      const lines = await retrieveCartLines()
      const omnichannel = await getOmnichannelAvailability([
        variantId,
        ...lines.map((line) => line.variant_id ?? ""),
      ])
      const current = cartFulfillment(lines, omnichannel.locations)

      if (fulfillment === "pickup") {
        // Also checks this item against the store's stock.
        const needsMove =
          current.mode !== "pickup" || current.pickupLocationId !== locationId
        const problem = await convertCartLines({
          cartId: cart.id,
          lines: needsMove ? lines : [],
          omnichannel,
          mode: "pickup",
          locationId,
          extra: {
            variantId,
            quantity:
              quantity +
              (needsMove ? 0 : unitsInOtherLines(lines, omnichannel.locations, variantId, locationId)),
          },
        })
        if (problem) {
          return { success: false, error: problem }
        }
      } else {
        const problem = checkLocationStock(
          omnichannel,
          variantId,
          locationId,
          quantity,
          unitsInOtherLines(lines, omnichannel.locations, variantId, locationId)
        )
        if (problem) {
          return { success: false, error: problem }
        }
        if (current.mode === "pickup") {
          await convertCartLines({ cartId: cart.id, lines, omnichannel, mode: "delivery" })
        }
      }
      const location = omnichannel.locations.find((entry) => entry.id === locationId)!
      metadata = lineItemLocationMetadata(location, fulfillment)
    }

    const headers = {
      ...(await getAuthHeaders()),
    }
    const body = { variant_id: variantId, quantity, metadata }

    try {
      await sdk.store.cart.createLineItem(cart.id, body, {}, headers)
    } catch (error) {
      if (!isCartNotFound(error)) {
        throw error
      }
      // The cookie points at a cart that no longer exists (removed on the
      // server, or a stale cached copy): start a fresh cart and add to that.
      await removeCartId()
      await revalidateCart()
      const fresh = await getOrSetCart(countryCode)
      await sdk.store.cart.createLineItem(fresh.id, body, {}, headers)
    }
    await revalidateCart()

    return { success: true }
  } catch (error) {
    console.error("Add to cart failed:", error)
    return { success: false, error: cartErrorMessage(error) }
  }
}

const isCartNotFound = (error: unknown) =>
  (error as { status?: number })?.status === 404 &&
  /cart/i.test((error as Error).message ?? "")

export async function updateLineItem({
  lineId,
  quantity,
}: {
  lineId: string
  quantity: number
}): Promise<CartActionResult> {
  const cartId = await getCartId()

  if (!lineId || !cartId) {
    return { success: false, error: GENERIC_CART_ERROR }
  }

  try {
    const lines = await retrieveCartLines()
    const line = lines.find((entry) => entry.id === lineId)

    if (line?.variant_id && quantity > line.quantity) {
      const omnichannel = await getOmnichannelAvailability([line.variant_id])
      const locationId = lineLocationId(line.metadata, omnichannel.locations)
      if (locationId) {
        const problem = checkLocationStock(
          omnichannel,
          line.variant_id,
          locationId,
          quantity,
          unitsInOtherLines(
            lines,
            omnichannel.locations,
            line.variant_id,
            locationId,
            line.id
          )
        )
        if (problem) {
          return { success: false, error: problem }
        }
      }
    }

    const headers = {
      ...(await getAuthHeaders()),
    }

    await sdk.store.cart.updateLineItem(cartId, lineId, { quantity }, {}, headers)
    await revalidateCart()

    return { success: true }
  } catch (error) {
    console.error("Update line item failed:", error)
    return { success: false, error: cartErrorMessage(error) }
  }
}

/**
 * Moves a cart line to another ship-from location. When the cart already has
 * the same variant from that location, the two lines are merged.
 */
export async function changeLineItemLocation({
  lineId,
  locationId,
}: {
  lineId: string
  locationId: string
}): Promise<CartActionResult> {
  const cartId = await getCartId()

  if (!lineId || !cartId || !locationId) {
    return { success: false, error: GENERIC_CART_ERROR }
  }

  try {
    const lines = await retrieveCartLines()
    const line = lines.find((entry) => entry.id === lineId)

    if (!line?.variant_id) {
      return { success: false, error: GENERIC_CART_ERROR }
    }

    const omnichannel = await getOmnichannelAvailability([line.variant_id])
    if (lineLocationId(line.metadata, omnichannel.locations) === locationId) {
      return { success: true }
    }

    const problem = checkLocationStock(
      omnichannel,
      line.variant_id,
      locationId,
      line.quantity,
      unitsInOtherLines(lines, omnichannel.locations, line.variant_id, locationId, line.id)
    )
    if (problem) {
      return { success: false, error: problem }
    }

    const headers = {
      ...(await getAuthHeaders()),
    }
    const target = lines.find(
      (entry) =>
        entry.id !== line.id &&
        entry.variant_id === line.variant_id &&
        lineLocationId(entry.metadata, omnichannel.locations) === locationId
    )

    if (target) {
      // Grow the existing line first, so the units are never out of the cart.
      await sdk.store.cart.updateLineItem(
        cartId,
        target.id,
        { quantity: target.quantity + line.quantity },
        {},
        headers
      )
      await sdk.store.cart.deleteLineItem(cartId, line.id, {}, headers)
    } else {
      const location = omnichannel.locations.find((entry) => entry.id === locationId)!
      await sdk.store.cart.updateLineItem(
        cartId,
        line.id,
        {
          quantity: line.quantity,
          metadata: lineItemLocationMetadata(location, "delivery"),
        },
        {},
        headers
      )
    }

    await revalidateCart()
    return { success: true }
  } catch (error) {
    console.error("Change line item location failed:", error)
    return { success: false, error: cartErrorMessage(error) }
  }
}

export async function deleteLineItem(lineId: string) {
  if (!lineId) {
    throw new Error("Missing lineItem ID when deleting line item")
  }

  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("Missing cart ID when deleting line item")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  await sdk.store.cart
    .deleteLineItem(cartId, lineId, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function setShippingMethod({
  cartId,
  shippingMethodId,
}: {
  cartId: string
  shippingMethodId: string
}) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .addShippingMethod(cartId, { option_id: shippingMethodId }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
    })
    .catch(medusaError)
}

export async function initiatePaymentSession(
  cart: HttpTypes.StoreCart,
  data: HttpTypes.StoreInitializePaymentSession
) {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.payment
    .initiatePaymentSession(cart, data, {}, headers)
    .then(async (resp) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return resp
    })
    .catch(medusaError)
}

export async function applyPromotions(codes: string[]) {
  const cartId = await getCartId()

  if (!cartId) {
    throw new Error("No existing cart found")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.store.cart
    .update(cartId, { promo_codes: codes }, {}, headers)
    .then(async () => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)

      const fulfillmentCacheTag = await getCacheTag("fulfillment")
      revalidateTag(fulfillmentCacheTag)
    })
    .catch(medusaError)
}

export async function applyGiftCard(code: string) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, { gift_cards: [{ code }] }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function removeDiscount(code: string) {
  // const cartId = getCartId()
  // if (!cartId) return "No cartId cookie found"
  // try {
  //   await deleteDiscount(cartId, code)
  //   revalidateTag("cart")
  // } catch (error: any) {
  //   throw error
  // }
}

export async function removeGiftCard(
  codeToRemove: string,
  giftCards: any[]
  // giftCards: GiftCard[]
) {
  //   const cartId = getCartId()
  //   if (!cartId) return "No cartId cookie found"
  //   try {
  //     await updateCart(cartId, {
  //       gift_cards: [...giftCards]
  //         .filter((gc) => gc.code !== codeToRemove)
  //         .map((gc) => ({ code: gc.code })),
  //     }).then(() => {
  //       revalidateTag("cart")
  //     })
  //   } catch (error: any) {
  //     throw error
  //   }
}

export async function submitPromotionForm(
  currentState: unknown,
  formData: FormData
) {
  const code = formData.get("code") as string
  try {
    await applyPromotions([code])
  } catch (e: any) {
    return e.message
  }
}

// TODO: Pass a POJO instead of a form entity here
export async function setAddresses(currentState: unknown, formData: FormData) {
  try {
    if (!formData) {
      throw new Error("No form data found when setting addresses")
    }
    const cartId = getCartId()
    if (!cartId) {
      throw new Error("No existing cart found when setting addresses")
    }

    const data = {
      shipping_address: {
        first_name: formData.get("shipping_address.first_name"),
        last_name: formData.get("shipping_address.last_name"),
        address_1: formData.get("shipping_address.address_1"),
        address_2: "",
        company: formData.get("shipping_address.company"),
        postal_code: formData.get("shipping_address.postal_code"),
        city: formData.get("shipping_address.city"),
        country_code: formData.get("shipping_address.country_code"),
        province: formData.get("shipping_address.province"),
        phone: formData.get("shipping_address.phone"),
      },
      email: formData.get("email"),
    } as any

    const sameAsBilling = formData.get("same_as_billing")
    if (sameAsBilling === "on") data.billing_address = data.shipping_address

    if (sameAsBilling !== "on")
      data.billing_address = {
        first_name: formData.get("billing_address.first_name"),
        last_name: formData.get("billing_address.last_name"),
        address_1: formData.get("billing_address.address_1"),
        address_2: "",
        company: formData.get("billing_address.company"),
        postal_code: formData.get("billing_address.postal_code"),
        city: formData.get("billing_address.city"),
        country_code: formData.get("billing_address.country_code"),
        province: formData.get("billing_address.province"),
        phone: formData.get("billing_address.phone"),
      }
    await updateCart(data)
  } catch (e: any) {
    return e.message
  }

  redirect(
    `/${formData.get("shipping_address.country_code")}/checkout?step=delivery`
  )
}

/**
 * Places an order for a cart. If no cart ID is provided, it will use the cart ID from the cookies.
 * @param cartId - optional - The ID of the cart to place an order for.
 * @returns The cart object if the order was successful, or null if not.
 */
export async function placeOrder(cartId?: string) {
  const id = cartId || (await getCartId())

  if (!id) {
    throw new Error("No existing cart found when placing an order")
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const cartRes = await sdk.store.cart
    .complete(id, {}, headers)
    .then(async (cartRes) => {
      const cartCacheTag = await getCacheTag("carts")
      revalidateTag(cartCacheTag)
      return cartRes
    })
    .catch(medusaError)

  if (cartRes?.type === "order") {
    const countryCode =
      cartRes.order.shipping_address?.country_code?.toLowerCase()

    const orderCacheTag = await getCacheTag("orders")
    revalidateTag(orderCacheTag)

    removeCartId()
    redirect(`/${countryCode}/order/${cartRes?.order.id}/confirmed`)
  }

  return cartRes.cart
}

/**
 * Updates the countrycode param and revalidates the regions cache
 * @param regionId
 * @param countryCode
 */
export async function updateRegion(countryCode: string, currentPath: string) {
  const cartId = await getCartId()
  const region = await getRegion(countryCode)

  if (!region) {
    throw new Error(`Region not found for country code: ${countryCode}`)
  }

  if (cartId) {
    await updateCart({ region_id: region.id })
    const cartCacheTag = await getCacheTag("carts")
    revalidateTag(cartCacheTag)
  }

  const regionCacheTag = await getCacheTag("regions")
  revalidateTag(regionCacheTag)

  const productsCacheTag = await getCacheTag("products")
  revalidateTag(productsCacheTag)

  redirect(`/${countryCode}${currentPath}`)
}

export async function listCartOptions() {
  const cartId = await getCartId()
  const headers = {
    ...(await getAuthHeaders()),
  }
  const next = {
    ...(await getCacheOptions("shippingOptions")),
  }

  return await sdk.client.fetch<{
    shipping_options: HttpTypes.StoreCartShippingOption[]
  }>("/store/shipping-options", {
    query: { cart_id: cartId },
    next,
    headers,
    cache: "force-cache",
  })
}
