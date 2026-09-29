import type { MedusaContainer } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  addToCartWorkflow,
  completeCartWorkflow,
  updateLineItemInCartWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  type FulfillmentType,
  getLocationAvailability,
  lineItemFulfillment,
  lineItemLocationId,
  listOmnichannelLocations,
} from "../../lib/omnichannel"

// Medusa only checks stock across all of a sales channel's locations. When the
// shopper picked a location, these hooks check that location alone, so a line
// can never promise more units than the store or warehouse it ships from has.

type CartLine = {
  id: string
  variant_id: string | null
  quantity: number
  metadata?: Record<string, unknown> | null
}

type Wanted = {
  variantId: string
  locationId: string
  quantity: number
  fulfillment: FulfillmentType
  excludeLineId?: string
}

const loadCart = async (container: MedusaContainer, cartId: string) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "id",
      "sales_channel_id",
      "items.id",
      "items.variant_id",
      "items.quantity",
      "items.metadata",
    ],
    filters: { id: cartId },
  })
  const cart = data[0] as
    | { sales_channel_id: string | null; items?: CartLine[] | null }
    | undefined
  return {
    salesChannelId: cart?.sales_channel_id ?? undefined,
    items: cart?.items ?? [],
  }
}

const assertLocationStock = async (
  container: MedusaContainer,
  cartId: string,
  wanted: Wanted[]
) => {
  if (!wanted.length) {
    return
  }

  const cart = await loadCart(container, cartId)
  const locations = await listOmnichannelLocations(
    container,
    cart.salesChannelId ? [cart.salesChannelId] : []
  )
  const availability = await getLocationAvailability(
    container,
    wanted.map((entry) => entry.variantId),
    locations.map((location) => location.id)
  )

  for (const entry of wanted) {
    const location = locations.find((item) => item.id === entry.locationId)
    if (!location) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Lokasi pengiriman yang dipilih tidak tersedia untuk toko ini."
      )
    }
    if (entry.fulfillment === "pickup" && location.kind !== "store") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Lokasi pengiriman ini hanya melayani pengiriman, bukan ambil di toko."
      )
    }

    const available = availability[entry.variantId]?.[entry.locationId]
    if (available === null) {
      // No limit: the variant doesn't track inventory or allows backorders.
      continue
    }

    // Other lines of the same variant already shipping from this location.
    const alreadyInCart = cart.items
      .filter(
        (line) =>
          line.id !== entry.excludeLineId &&
          line.variant_id === entry.variantId &&
          lineItemLocationId(line.metadata) === entry.locationId
      )
      .reduce((sum, line) => sum + Number(line.quantity), 0)

    const units = available ?? 0
    if (alreadyInCart + entry.quantity > units) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        units <= 0
          ? `Stok ukuran ini di ${location.name} sudah habis.`
          : `Stok ukuran ini di ${location.name} tinggal ${units}.`
      )
    }
  }
}

addToCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const wanted: Wanted[] = []
  for (const item of input.items ?? []) {
    const locationId = lineItemLocationId(
      item.metadata as Record<string, unknown> | undefined
    )
    if (item.variant_id && locationId) {
      wanted.push({
        variantId: item.variant_id,
        locationId,
        quantity: Number(item.quantity ?? 1),
        fulfillment: lineItemFulfillment(item.metadata as Record<string, unknown> | undefined),
      })
    }
  }
  await assertLocationStock(container, input.cart_id, wanted)
})

updateLineItemInCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const update = input.update as {
    quantity?: number
    metadata?: Record<string, unknown> | null
  }
  if (!update.quantity) {
    // Removing the line (quantity 0) never needs stock.
    return
  }

  const cart = await loadCart(container, input.cart_id)
  const line = cart.items.find((item) => item.id === input.item_id)
  const locationId =
    lineItemLocationId(update.metadata) ?? lineItemLocationId(line?.metadata)

  if (!line?.variant_id || !locationId) {
    return
  }

  await assertLocationStock(container, input.cart_id, [
    {
      variantId: line.variant_id,
      locationId,
      quantity: Number(update.quantity),
      fulfillment: lineItemFulfillment(update.metadata ?? line.metadata),
      excludeLineId: line.id,
    },
  ])
})

// Before an order is placed: a bag picked up at a store must use that store's
// pickup shipping option and every line must come from that store; a bag that
// is delivered must not use a pickup option. Carts without omnichannel data
// (no line picked a location) are left to Medusa.
completeCartWorkflow.hooks.validate(async ({ input }, { container }) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "cart",
    fields: [
      "items.metadata",
      "shipping_methods.shipping_option_id",
    ],
    filters: { id: input.id },
  })
  const cart = data[0] as
    | {
        items?: { metadata?: Record<string, unknown> | null }[] | null
        shipping_methods?: { shipping_option_id?: string | null }[] | null
      }
    | undefined
  const lines = cart?.items ?? []
  if (!lines.some((line) => lineItemLocationId(line.metadata))) {
    return
  }

  const optionId = cart?.shipping_methods?.at(-1)?.shipping_option_id
  if (!optionId) {
    return
  }
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "service_zone.fulfillment_set.type", "service_zone.fulfillment_set.location.id"],
    filters: { id: optionId },
  })
  const set = (options[0] as
    | { service_zone?: { fulfillment_set?: { type?: string; location?: { id: string } | null } | null } | null }
    | undefined)?.service_zone?.fulfillment_set
  const optionIsPickup = set?.type === "pickup"

  const pickupLines = lines.filter((line) => lineItemFulfillment(line.metadata) === "pickup")
  if (!pickupLines.length) {
    if (optionIsPickup) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        "Tas kamu diatur untuk dikirim. Pilih metode pengiriman, atau ubah cara terima menjadi ambil di toko di tas belanja."
      )
    }
    return
  }

  const storeIds = new Set(lines.map((line) => lineItemLocationId(line.metadata)))
  if (pickupLines.length !== lines.length || storeIds.size !== 1) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Semua produk harus diambil di toko yang sama. Atur ulang cara terima di tas belanja."
    )
  }
  const [storeId] = [...storeIds]
  if (!optionIsPickup || set?.location?.id !== storeId) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Pilih opsi ambil di toko yang sama dengan toko di tas belanja."
    )
  }
})
