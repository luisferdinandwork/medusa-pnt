import { createHash, createHmac, randomUUID, timingSafeEqual } from "crypto"
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

// DOKU Checkout (hosted payment page), non-SNAP signature.
// https://developers.doku.com/accept-payments/doku-checkout

const API_URL: Record<GatewayEnvironment, string> = {
  sandbox: "https://api-sandbox.doku.com",
  production: "https://api.doku.com",
}

export type DokuBody = Record<string, unknown> & {
  transaction?: { status?: string; date?: string }
  channel?: { id?: string }
  service?: { id?: string }
  order?: { invoice_number?: string; amount?: number | string }
  message?: string[]
  error_messages?: string[]
  error?: { message?: string; code?: string }
  response?: { payment?: { url?: string; expired_date?: string } }
}

// ISO 8601 in UTC without milliseconds, e.g. 2020-08-11T08:45:42Z.
const timestamp = () => new Date().toISOString().replace(/\.\d{3}Z$/, "Z")

const digestOf = (body: string | Buffer) =>
  createHash("sha256").update(body).digest("base64")

/** "HMACSHA256=" + base64 HMAC of the component lines. GET has no Digest. */
export const dokuSignature = (
  parts: {
    clientId: string
    requestId: string
    timestamp: string
    target: string
    digest?: string
  },
  secretKey: string
) => {
  const lines = [
    `Client-Id:${parts.clientId}`,
    `Request-Id:${parts.requestId}`,
    `Request-Timestamp:${parts.timestamp}`,
    `Request-Target:${parts.target}`,
    ...(parts.digest ? [`Digest:${parts.digest}`] : []),
  ]
  return `HMACSHA256=${createHmac("sha256", secretKey).update(lines.join("\n")).digest("base64")}`
}

const errorMessage = (body: DokuBody | null, fallback: string) =>
  body?.error_messages?.join(", ") ||
  body?.error?.message ||
  (body?.message && body.message.join(", ")) ||
  fallback

export const normalizeDokuStatus = (status: string | undefined): GatewayStatus => {
  switch (status) {
    case "SUCCESS":
      return "paid"
    case "FAILED":
      return "failed"
    case "EXPIRED":
      return "expired"
    case "VOIDED":
      return "canceled"
    case "REFUNDED":
    case "PARTIAL_REFUNDED":
      return "refunded"
    default:
      // PENDING, REDIRECT (card 3DS), TIMEOUT (e-money): not final yet.
      return "pending"
  }
}

export const toDokuStatus = (body: DokuBody): StatusResult => {
  const status = normalizeDokuStatus(body.transaction?.status)
  return {
    status,
    gatewayStatus: body.transaction?.status ?? null,
    paymentMethod: body.channel?.id ?? body.service?.id ?? null,
    paidAt: status === "paid" && body.transaction?.date ? new Date(body.transaction.date) : null,
    raw: body,
  }
}

// DOKU sends dates as yyyyMMddHHmmss in UTC+7.
const parseDokuDate = (value: string | undefined) => {
  const match = value?.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/)
  if (!match) {
    return null
  }
  const [, y, m, d, hh, mm, ss] = match
  return new Date(`${y}-${m}-${d}T${hh}:${mm}:${ss}+07:00`)
}

const header = (headers: Record<string, string | string[] | undefined>, name: string) => {
  const value = headers[name.toLowerCase()] ?? headers[name]
  return Array.isArray(value) ? value[0] : value
}

/**
 * Checks an HTTP notification from DOKU. `target` is the path of the URL DOKU
 * posted to (the notification URL), which is part of the signed string.
 */
export const verifyDokuNotification = (input: {
  headers: Record<string, string | string[] | undefined>
  rawBody: string | Buffer
  target: string
  clientId: string
  secretKey: string
}) => {
  const clientId = header(input.headers, "Client-Id")
  const requestId = header(input.headers, "Request-Id")
  const requestTimestamp = header(input.headers, "Request-Timestamp")
  const received = header(input.headers, "Signature") ?? ""
  if (clientId !== input.clientId || !requestId || !requestTimestamp) {
    return false
  }
  const expected = dokuSignature(
    {
      clientId,
      requestId,
      timestamp: requestTimestamp,
      target: input.target,
      digest: digestOf(input.rawBody),
    },
    input.secretKey
  )
  return (
    received.length === expected.length &&
    timingSafeEqual(Buffer.from(received), Buffer.from(expected))
  )
}

export const dokuClient = (config: {
  environment: GatewayEnvironment
  clientId: string
  secretKey: string
}): GatewayClient => {
  const base = API_URL[config.environment]

  const call = async (method: "GET" | "POST", target: string, body?: Record<string, unknown>) => {
    const json = body ? JSON.stringify(body) : undefined
    const requestId = randomUUID()
    const requestTimestamp = timestamp()
    return requestJson(`${base}${target}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        "Client-Id": config.clientId,
        "Request-Id": requestId,
        "Request-Timestamp": requestTimestamp,
        Signature: dokuSignature(
          {
            clientId: config.clientId,
            requestId,
            timestamp: requestTimestamp,
            target,
            digest: json ? digestOf(json) : undefined,
          },
          config.secretKey
        ),
      },
      body: json,
    }) as Promise<{ status: number; body: DokuBody | null }>
  }

  const statusTarget = (reference: string) => `/orders/v1/status/${encodeURIComponent(reference)}`

  return {
    async createCheckout(request: CheckoutRequest) {
      const name = fullName(request.customer).replace(/[^A-Za-z ]/g, "").trim()
      const phone = normalizePhone(request.customer.phone)
      const customer = {
        ...(name ? { name: name.slice(0, 255) } : {}),
        ...(request.customer.email ? { email: request.customer.email.slice(0, 128) } : {}),
        ...(phone ? { phone: phone.slice(0, 16) } : {}),
      }

      const { status, body } = await call("POST", "/checkout/v1/payment", {
        order: {
          amount: request.amount,
          invoice_number: request.reference,
          currency: "IDR",
          // Every result comes back here; the storefront checks the real status.
          callback_url: request.returnUrl,
          callback_url_cancel: request.returnUrl,
          callback_url_result: request.returnUrl,
          auto_redirect: true,
          // One line for the whole order, so it always adds up to the total.
          // Pay-later methods need line items to be present.
          line_items: [
            { id: "order", name: request.itemName, quantity: 1, price: request.amount },
          ],
        },
        payment: {
          payment_due_date: request.expiryMinutes,
          ...(request.paymentMethods.length
            ? { payment_method_types: request.paymentMethods }
            : {}),
        },
        ...(Object.keys(customer).length ? { customer } : {}),
        ...(request.notificationUrl
          ? { additional_info: { override_notification_url: request.notificationUrl } }
          : {}),
      })

      const payment = body?.response?.payment
      if (status >= 300 || !payment?.url) {
        throw new GatewayRequestError(errorMessage(body, `HTTP ${status}`), status, body)
      }
      return {
        redirectUrl: payment.url,
        expiresAt:
          parseDokuDate(payment.expired_date) ??
          new Date(Date.now() + request.expiryMinutes * 60 * 1000),
      }
    },

    async getStatus(reference: string) {
      const { status, body } = await call("GET", statusTarget(reference))
      if (body?.transaction?.status) {
        return toDokuStatus(body)
      }
      // No transaction yet: the shopper has not picked a method on the page.
      if (status === 404 || status === 400) {
        return { status: "pending", gatewayStatus: null, paymentMethod: null, paidAt: null, raw: body }
      }
      throw new GatewayRequestError(errorMessage(body, `HTTP ${status}`), status, body)
    },

    async testConnection() {
      const { status, body } = await call("GET", statusTarget(`CONNECTIONTEST${Date.now()}`))
      if (status === 401 || status === 403) {
        return {
          ok: false,
          message: `DOKU rejected the Client ID or Secret key: ${errorMessage(body, `HTTP ${status}`)}. Sandbox keys only work in the sandbox environment.`,
        }
      }
      if (status >= 500) {
        return { ok: false, message: `DOKU answered HTTP ${status}. Try again later.` }
      }
      return { ok: true, message: "DOKU accepted the Client ID and Secret key." }
    },
  }
}
