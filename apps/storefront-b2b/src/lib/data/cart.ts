import "server-only"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/sdk"
import { getAuthHeaders, getCartId, removeCartId, setCartId } from "@/lib/cookies"
import { getRegion } from "./catalog"

export const CART_FIELDS =
  "*items,*items.variant,+items.thumbnail,*shipping_address,*billing_address,*shipping_methods,*payment_collection,*payment_collection.payment_sessions,*promotions"

export async function getCart(): Promise<HttpTypes.StoreCart | null> {
  const cartId = await getCartId()
  if (!cartId) return null
  return sdk.store.cart
    .retrieve(cartId, { fields: CART_FIELDS }, await getAuthHeaders())
    .then(({ cart }) => (cart.completed_at ? null : cart))
    .catch(() => null)
}

export async function getOrCreateCart(): Promise<HttpTypes.StoreCart> {
  const existing = await getCart()
  if (existing) return existing

  await removeCartId().catch(() => {})
  const region = await getRegion()
  const { cart } = await sdk.store.cart.create(
    { region_id: region.id },
    {},
    await getAuthHeaders()
  )
  await setCartId(cart.id)
  return cart
}

export type ShippingOption = HttpTypes.StoreCartShippingOption & {
  is_pickup: boolean
  pickup_address: string | null
}

type OptionWithZone = HttpTypes.StoreCartShippingOption & {
  service_zone?: {
    fulfillment_set?: {
      type?: string
      location?: { address?: HttpTypes.StoreCartAddress }
    }
  }
}

// Options for the cart, with the price already resolved: flat options carry
// their amount; "calculated" ones are priced by the fulfillment provider.
export async function listShippingOptions(cartId: string): Promise<ShippingOption[]> {
  const headers = await getAuthHeaders()
  const { shipping_options } = await sdk.store.fulfillment.listCartOptions(
    {
      cart_id: cartId,
      fields:
        "+service_zone.fulfillment_set.type,*prices,*prices.price_rules",
    },
    headers
  )

  return Promise.all(
    ((shipping_options ?? []) as OptionWithZone[]).map(async (option) => {
      const fulfillmentSet = option.service_zone?.fulfillment_set
      const address = fulfillmentSet?.location?.address
      const isPickup = fulfillmentSet?.type === "pickup"

      let amount: number = option.amount
      if (option.price_type === "calculated") {
        amount = await sdk.store.fulfillment
          .calculate(option.id, { cart_id: cartId }, {}, headers)
          .then(({ shipping_option }) => shipping_option.amount ?? option.amount)
          .catch(() => option.amount)
      }

      return {
        ...option,
        amount,
        is_pickup: isPickup,
        pickup_address: isPickup && address
          ? [address.address_1, address.city, address.postal_code].filter(Boolean).join(", ")
          : null,
      }
    })
  )
}

export async function listPaymentProviders(regionId: string) {
  const { payment_providers } = await sdk.store.payment.listPaymentProviders(
    { region_id: regionId },
    await getAuthHeaders()
  )
  return payment_providers ?? []
}
