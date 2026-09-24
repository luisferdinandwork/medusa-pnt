import { HttpTypes } from "@medusajs/types"

export const STEPS = ["alamat", "pengiriman", "pembayaran", "tinjau"] as const
export type Step = (typeof STEPS)[number]

export const STEP_TITLES: Record<Step, string> = {
  alamat: "Alamat pengiriman",
  pengiriman: "Metode pengiriman",
  pembayaran: "Pembayaran",
  tinjau: "Tinjau pesanan",
}

// A payment session is "pending" from the moment it is created until the cart
// is completed.
export function getActivePaymentSession(cart: HttpTypes.StoreCart) {
  return cart.payment_collection?.payment_sessions?.find((s) => s.status === "pending")
}

export function isAddressDone(cart: HttpTypes.StoreCart) {
  return Boolean(cart.shipping_address?.address_1 && cart.email)
}

export function isShippingDone(cart: HttpTypes.StoreCart) {
  return (cart.shipping_methods?.length ?? 0) > 0
}

// A fully discounted cart (total 0) needs no payment session.
export function isPaymentDone(cart: HttpTypes.StoreCart) {
  return cart.total === 0 || Boolean(getActivePaymentSession(cart))
}

// The furthest step the customer can reach with what the cart already has.
export function getFurthestStep(cart: HttpTypes.StoreCart): Step {
  if (!isAddressDone(cart)) return "alamat"
  if (!isShippingDone(cart)) return "pengiriman"
  if (!isPaymentDone(cart)) return "pembayaran"
  return "tinjau"
}

// Honors ?step= only up to the furthest reachable step, so a step can't be
// opened before the ones it depends on are done.
export function resolveStep(requested: string | undefined, cart: HttpTypes.StoreCart): Step {
  const furthest = getFurthestStep(cart)
  const wanted = STEPS.find((s) => s === requested)
  return wanted && STEPS.indexOf(wanted) <= STEPS.indexOf(furthest) ? wanted : furthest
}

export const PAYMENT_TITLES: Record<string, string> = {
  pp_system_default: "Transfer bank (invoice)",
}

export function paymentTitle(providerId: string) {
  return PAYMENT_TITLES[providerId] ?? providerId.replace(/^pp_/, "").replace(/_/g, " ")
}

// Card and redirect-based providers need client-side SDKs this storefront does
// not load; only manual/offline providers can complete an order here.
export function isSupportedProvider(providerId: string) {
  return providerId.startsWith("pp_system_default")
}
