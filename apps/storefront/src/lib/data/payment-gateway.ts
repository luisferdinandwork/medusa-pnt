"use server"

import { sdk } from "@lib/config"
import { isGatewayProvider } from "@lib/constants"
import medusaError from "@lib/util/medusa-error"
import { HttpTypes } from "@medusajs/types"
import { revalidateTag } from "next/cache"
import { getAuthHeaders, getCacheTag, getCartId, removeCartId } from "./cookies"

// Midtrans / DOKU payments: the shopper pays on the gateway's page and comes
// back to /api/payment-gateway/return. Nothing here trusts what the gateway
// put in the URL: completing the cart makes the backend ask the gateway.

type GatewaySessionData = {
  gateway_id?: string
  gateway_name?: string
  return_url?: string
  country_code?: string
  redirect_url?: string
  expires_at?: string | null
  amount?: number
  redirects?: { success_url?: string; pending_url?: string; failure_url?: string }
}

export type GatewayOutcome = {
  status: "paid" | "pending" | "failed"
  /** A storefront path ("/id/order/...") or a full URL, from the gateway settings. */
  redirectTo: string
}

// Same as DEFAULT_REDIRECTS in the backend's payment_gateway module.
const DEFAULT_REDIRECTS = {
  success_url: "/{country_code}/order/{order_id}/confirmed",
  pending_url: "/{country_code}/checkout/payment-pending",
  failure_url: "/{country_code}/checkout?step=payment&payment_status=failed",
}

const DEFAULT_COUNTRY = process.env.NEXT_PUBLIC_DEFAULT_REGION || "id"

const SESSION_FIELDS =
  "id,completed_at,shipping_address.country_code,payment_collection.payment_sessions.id,payment_collection.payment_sessions.provider_id,payment_collection.payment_sessions.status,payment_collection.payment_sessions.data"

const fetchCart = async (cartId: string) =>
  sdk.client
    .fetch<HttpTypes.StoreCartResponse>(`/store/carts/${cartId}`, {
      method: "GET",
      query: { fields: SESSION_FIELDS },
      headers: { ...(await getAuthHeaders()) },
      cache: "no-store",
    })
    .then(({ cart }) => cart)
    .catch(() => null)

const gatewaySession = (cart: HttpTypes.StoreCart | null) =>
  cart?.payment_collection?.payment_sessions?.find((session) =>
    isGatewayProvider(session.provider_id)
  )

/**
 * The gateway page to send the shopper to. Opens a new charge when the old
 * one expired (the payment page only lives as long as the gateway's time
 * limit), so a shopper who waited on the review step can still pay.
 */
export async function startGatewayPayment(): Promise<{ url?: string; error?: string }> {
  const cartId = await getCartId()
  const cart = cartId ? await fetchCart(cartId) : null
  const session = gatewaySession(cart)
  const data = (session?.data ?? {}) as GatewaySessionData

  if (!cart || !session || session.status !== "pending") {
    return { error: "Pilih metode pembayaran lagi sebelum membayar." }
  }

  const expired = !!data.expires_at && new Date(data.expires_at).getTime() <= Date.now() + 60_000
  if (data.redirect_url && !expired) {
    return { url: data.redirect_url }
  }

  try {
    const { payment_collection } = await sdk.store.payment
      .initiatePaymentSession(
        cart,
        {
          provider_id: session.provider_id,
          data: {
            gateway_id: data.gateway_id,
            return_url: data.return_url,
            country_code: data.country_code,
          },
        },
        {},
        { ...(await getAuthHeaders()) }
      )
      .catch(medusaError)
    revalidateTag(await getCacheTag("carts"))

    const fresh = payment_collection?.payment_sessions?.find((item) =>
      isGatewayProvider(item.provider_id)
    )
    const url = (fresh?.data as GatewaySessionData | undefined)?.redirect_url
    return url ? { url } : { error: "Halaman pembayaran belum tersedia. Coba lagi." }
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) }
  }
}

/**
 * Tries to place the order for a cart paid through a gateway and tells where
 * the shopper goes next: the order page once paid, the waiting page while the
 * payment is pending (e.g. a VA not transferred yet), back to the payment step
 * when it failed or expired. Safe to call repeatedly; notifications from the
 * gateway may have placed the order already.
 */
export async function settleGatewayPayment(
  cartId?: string | null,
  countryCodeHint?: string | null
): Promise<GatewayOutcome> {
  const id = cartId || (await getCartId())
  const before = id ? await fetchCart(id) : null
  const session = gatewaySession(before)
  const data = (session?.data ?? {}) as GatewaySessionData
  const countryCode = (
    countryCodeHint ||
    data.country_code ||
    before?.shipping_address?.country_code ||
    DEFAULT_COUNTRY
  ).toLowerCase()
  const redirects = { ...DEFAULT_REDIRECTS, ...(data.redirects ?? {}) }
  const fill = (template: string, orderId = "") =>
    template
      .replaceAll("{country_code}", encodeURIComponent(countryCode))
      .replaceAll("{order_id}", encodeURIComponent(orderId))
      .replaceAll("{cart_id}", encodeURIComponent(id ?? ""))

  if (!id || !before) {
    return { status: "failed", redirectTo: `/${countryCode}/cart` }
  }

  const result = await sdk.store.cart
    .complete(id, {}, { ...(await getAuthHeaders()) })
    .catch(() => null)

  if (result?.type === "order") {
    revalidateTag(await getCacheTag("carts"))
    revalidateTag(await getCacheTag("orders"))
    if ((await getCartId()) === id) {
      await removeCartId()
    }
    return { status: "paid", redirectTo: fill(redirects.success_url, result.order.id) }
  }

  // Completing asked the gateway; the session now carries its answer.
  const after = gatewaySession(await fetchCart(id))
  revalidateTag(await getCacheTag("carts"))
  if (after && ["pending", "requires_more", "authorized"].includes(after.status)) {
    return { status: "pending", redirectTo: fill(redirects.pending_url) }
  }
  return { status: "failed", redirectTo: fill(redirects.failure_url) }
}
