import type { ProviderWebhookPayload } from "@medusajs/framework/types"
import { webhookPath } from "../payment-gateway/types"
import type { GatewayRecord } from "../../lib/payment-gateways"
import {
  type DokuBody,
  toDokuStatus,
  verifyDokuNotification,
} from "../../lib/payment-gateways/doku"
import { GatewayPaymentProvider } from "../../lib/payment-gateways/provider"

// DOKU Checkout. Keys and settings live in the payment_gateway module (admin:
// Storefronts > Payments); notifications arrive at /hooks/payment/doku_doku.
class DokuPaymentProviderService extends GatewayPaymentProvider {
  static identifier = "doku"
  protected readonly gatewayProvider = "doku" as const

  protected parseNotification(payload: ProviderWebhookPayload["payload"]) {
    const body = payload.data as DokuBody | undefined
    const reference = body?.order?.invoice_number
    if (!body || typeof reference !== "string") {
      return null
    }
    return { reference, status: toDokuStatus(body) }
  }

  // DOKU signs the path it posted to. That is this backend's webhook route,
  // or the path of the gateway's notification URL override when it has one
  // (e.g. behind a proxy that adds a prefix).
  protected verifyNotification(
    payload: ProviderWebhookPayload["payload"],
    gateway: GatewayRecord,
    credentials: Record<string, string>
  ) {
    const targets = new Set([webhookPath("doku")])
    if (gateway.notification_url) {
      try {
        targets.add(new URL(gateway.notification_url).pathname)
      } catch {
        // An invalid override can't have been called; keep the default.
      }
    }
    return [...targets].some((target) =>
      verifyDokuNotification({
        headers: payload.headers as Record<string, string | string[] | undefined>,
        rawBody: payload.rawData,
        target,
        clientId: credentials.client_id,
        secretKey: credentials.secret_key,
      })
    )
  }
}

export default DokuPaymentProviderService
