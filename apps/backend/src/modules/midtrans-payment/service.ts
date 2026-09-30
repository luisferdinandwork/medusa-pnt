import type { ProviderWebhookPayload } from "@medusajs/framework/types"
import type { GatewayRecord } from "../../lib/payment-gateways"
import { toMidtransStatus, verifyMidtransSignature } from "../../lib/payment-gateways/midtrans"
import { GatewayPaymentProvider } from "../../lib/payment-gateways/provider"

// Midtrans Snap. Keys and settings live in the payment_gateway module (admin:
// Storefronts > Payments); notifications arrive at
// /hooks/payment/midtrans_midtrans.
class MidtransPaymentProviderService extends GatewayPaymentProvider {
  static identifier = "midtrans"
  protected readonly gatewayProvider = "midtrans" as const

  protected parseNotification(payload: ProviderWebhookPayload["payload"]) {
    const body = payload.data as Record<string, unknown>
    if (typeof body?.order_id !== "string" || !body.transaction_status) {
      return null
    }
    return { reference: body.order_id, status: toMidtransStatus(body) }
  }

  protected verifyNotification(
    payload: ProviderWebhookPayload["payload"],
    _gateway: GatewayRecord,
    credentials: Record<string, string>
  ) {
    return verifyMidtransSignature(payload.data as Record<string, unknown>, credentials.server_key)
  }
}

export default MidtransPaymentProviderService
