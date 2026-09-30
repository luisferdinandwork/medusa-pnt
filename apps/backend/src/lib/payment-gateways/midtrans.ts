import { createHash, randomUUID, timingSafeEqual } from "crypto"
import type { GatewayEnvironment } from "../../modules/payment-gateway/types"
import {
  type CheckoutRequest,
  type GatewayClient,
  GatewayRequestError,
  type GatewayStatus,
  fullName,
  normalizePhone,
  requestJson,
  type StatusResult,
} from "./common"

// Midtrans Snap (hosted payment page) and Core API.
// https://docs.midtrans.com/reference/backend-integration

const SNAP_URL: Record<GatewayEnvironment, string> = {
  sandbox: "https://app.sandbox.midtrans.com/snap/v1/transactions",
  production: "https://app.midtrans.com/snap/v1/transactions",
}

const API_URL: Record<GatewayEnvironment, string> = {
  sandbox: "https://api.sandbox.midtrans.com",
  production: "https://api.midtrans.com",
}

type MidtransBody = Record<string, unknown> & {
  status_code?: string
  status_message?: string
  transaction_status?: string
  fraud_status?: string
  payment_type?: string
  transaction_id?: string
  gross_amount?: string
  settlement_time?: string
  transaction_time?: string
  va_numbers?: { bank?: string }[]
  permata_va_number?: string
  error_messages?: string[]
}

const errorMessage = (body: MidtransBody | null, fallback: string) =>
  body?.error_messages?.join(", ") ||
  body?.status_message ||
  (typeof body?.error === "string" ? body.error : "") ||
  fallback

const UNAUTHORIZED_HINT =
  "check the server key and that it belongs to this environment (sandbox keys start with SB-Mid-server-)"

/**
 * The Snap status in our vocabulary. A card `capture` only counts once the
 * fraud check accepted it; `challenge` waits for the merchant's review.
 */
export const normalizeMidtransStatus = (body: MidtransBody): GatewayStatus => {
  switch (body.transaction_status) {
    case "settlement":
      return "paid"
    case "capture":
      if (body.fraud_status === "challenge") {
        return "pending"
      }
      return body.fraud_status === "deny" ? "failed" : "paid"
    case "authorize":
      return "authorized"
    case "deny":
    case "failure":
      return "failed"
    case "cancel":
      return "canceled"
    case "expire":
      return "expired"
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "refunded"
    default:
      return "pending"
  }
}

/** e.g. "bca_va", "mandiri_bill", "gopay", "qris", "credit_card". */
const paymentMethodOf = (body: MidtransBody) => {
  if (body.payment_type === "bank_transfer") {
    if (body.permata_va_number) {
      return "permata_va"
    }
    const bank = body.va_numbers?.[0]?.bank
    return bank ? `${bank}_va` : "bank_transfer"
  }
  if (body.payment_type === "echannel") {
    return "mandiri_bill"
  }
  return body.payment_type ?? null
}

export const toMidtransStatus = (body: MidtransBody): StatusResult => {
  const status = normalizeMidtransStatus(body)
  const paidAt = body.settlement_time || body.transaction_time
  return {
    status,
    gatewayStatus: body.transaction_status ?? null,
    paymentMethod: paymentMethodOf(body),
    paidAt: status === "paid" && paidAt ? new Date(`${paidAt.replace(" ", "T")}+07:00`) : null,
    raw: body,
  }
}

/** SHA512(order_id + status_code + gross_amount + server key). */
export const verifyMidtransSignature = (body: MidtransBody, serverKey: string) => {
  const received = typeof body.signature_key === "string" ? body.signature_key : ""
  const expected = createHash("sha512")
    .update(`${body.order_id ?? ""}${body.status_code ?? ""}${body.gross_amount ?? ""}${serverKey}`)
    .digest("hex")
  return (
    received.length === expected.length &&
    timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
}

export const midtransClient = (config: {
  environment: GatewayEnvironment
  serverKey: string
}): GatewayClient => {
  const headers = (extra: Record<string, string> = {}) => ({
    Accept: "application/json",
    "Content-Type": "application/json",
    Authorization: `Basic ${Buffer.from(`${config.serverKey}:`).toString("base64")}`,
    ...extra,
  })
  const api = API_URL[config.environment]

  // Core API answers HTTP 200 with its own status_code in the body; `accept`
  // lists the codes that mean success for this call.
  const post = async (
    path: string,
    body?: Record<string, unknown>,
    accept: string[] = ["200", "201"]
  ) => {
    const { status, body: response } = await requestJson(`${api}${path}`, {
      method: "POST",
      headers: headers(),
      body: body ? JSON.stringify(body) : undefined,
    })
    const result = response as MidtransBody | null
    if (status >= 300 || (result?.status_code && !accept.includes(result.status_code))) {
      throw new GatewayRequestError(errorMessage(result, `HTTP ${status}`), status, result)
    }
    return result ?? {}
  }

  const fetchStatus = async (reference: string) => {
    const { status, body } = await requestJson(
      `${api}/v2/${encodeURIComponent(reference)}/status`,
      { method: "GET", headers: headers() }
    )
    return { httpStatus: status, body: (body ?? {}) as MidtransBody }
  }

  return {
    async createCheckout(request: CheckoutRequest) {
      const phone = normalizePhone(request.customer.phone)
      const payload = {
        transaction_details: {
          order_id: request.reference,
          gross_amount: request.amount,
        },
        // One line for the whole order, so it always adds up to the total.
        // Some methods (Akulaku, Kredivo) need item details to be present.
        item_details: [
          {
            id: "order",
            name: request.itemName.slice(0, 50),
            price: request.amount,
            quantity: 1,
          },
        ],
        customer_details: {
          first_name: request.customer.first_name || fullName(request.customer) || undefined,
          last_name: request.customer.last_name || undefined,
          email: request.customer.email || undefined,
          phone,
        },
        // Every result comes back here; the storefront checks the real status.
        callbacks: { finish: request.returnUrl },
        expiry: { unit: "minutes", duration: request.expiryMinutes },
        ...(request.paymentMethods.length ? { enabled_payments: request.paymentMethods } : {}),
      }

      const { status, body } = await requestJson(SNAP_URL[config.environment], {
        method: "POST",
        headers: headers(
          request.notificationUrl ? { "X-Override-Notification": request.notificationUrl } : {}
        ),
        body: JSON.stringify(payload),
      })
      const result = (body ?? {}) as MidtransBody & { token?: string; redirect_url?: string }
      if (status >= 300 || !result.redirect_url) {
        const message = errorMessage(result, `HTTP ${status}`)
        throw new GatewayRequestError(
          status === 401 ? `${message}: ${UNAUTHORIZED_HINT}` : message,
          status,
          result
        )
      }
      return {
        redirectUrl: result.redirect_url,
        token: result.token,
        expiresAt: new Date(Date.now() + request.expiryMinutes * 60 * 1000),
      }
    },

    async getStatus(reference: string) {
      const { httpStatus, body } = await fetchStatus(reference)
      // 404: the shopper opened Snap but has not chosen a method yet.
      if (body.status_code === "404" || httpStatus === 404) {
        return { status: "pending", gatewayStatus: null, paymentMethod: null, paidAt: null, raw: body }
      }
      if (httpStatus >= 300 && !body.transaction_status) {
        throw new GatewayRequestError(errorMessage(body, `HTTP ${httpStatus}`), httpStatus, body)
      }
      return toMidtransStatus(body)
    },

    async expire(reference: string) {
      // 407 is Midtrans' "transaction is expired".
      await post(`/v2/${encodeURIComponent(reference)}/expire`, undefined, ["200", "407"])
    },

    async capture(_reference: string, amount: number, raw: Record<string, unknown> | null) {
      await post("/v2/capture", {
        transaction_id: (raw as MidtransBody | null)?.transaction_id,
        gross_amount: amount,
      })
    },

    async refund(reference: string, amount: number, reason: string) {
      return post(`/v2/${encodeURIComponent(reference)}/refund`, {
        refund_key: randomUUID(),
        amount,
        reason,
      })
    },

    async testConnection() {
      const { httpStatus, body } = await fetchStatus(`CONNECTION-TEST-${Date.now()}`)
      if (body.status_code === "404" || httpStatus === 404) {
        return { ok: true, message: "Midtrans accepted the server key." }
      }
      if (body.status_code === "401" || httpStatus === 401) {
        return {
          ok: false,
          message: `Midtrans rejected the server key (${errorMessage(body, "unauthorized")}): ${UNAUTHORIZED_HINT}.`,
        }
      }
      return { ok: false, message: `Unexpected answer from Midtrans: ${errorMessage(body, `HTTP ${httpStatus}`)}` }
    },
  }
}
