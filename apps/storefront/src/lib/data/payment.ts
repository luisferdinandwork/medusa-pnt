"use server"

import { sdk } from "@lib/config"
import { getAuthHeaders, getCacheOptions } from "./cookies"
import { HttpTypes } from "@medusajs/types"

/** A Midtrans / DOKU gateway this storefront's sales channel offers. */
export type StorePaymentGateway = {
  id: string
  name: string
  description: string | null
  provider: "midtrans" | "doku"
  provider_id: string
  environment: "sandbox" | "production"
  payment_methods: string[]
  rank: number
  client_key: string | null
}

// Not cached: turning a gateway on or off in the admin shows at the next
// checkout visit.
export const listPaymentGateways = async () => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  return sdk.client
    .fetch<{ payment_gateways: StorePaymentGateway[] }>(
      `/store/payment-gateways`,
      { method: "GET", headers, cache: "no-store" }
    )
    .then(({ payment_gateways }) => payment_gateways)
    .catch(() => [] as StorePaymentGateway[])
}

export const listCartPaymentMethods = async (regionId: string) => {
  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("payment_providers")),
  }

  return sdk.client
    .fetch<HttpTypes.StorePaymentProviderListResponse>(
      `/store/payment-providers`,
      {
        method: "GET",
        query: { region_id: regionId },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ payment_providers }) =>
      payment_providers.sort((a, b) => {
        return a.id > b.id ? 1 : -1
      })
    )
    .catch(() => {
      return null
    })
}
