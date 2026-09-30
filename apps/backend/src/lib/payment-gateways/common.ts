import { randomBytes } from "crypto"
import type { TransactionStatus } from "../../modules/payment-gateway/types"

/** Status of a charge at the gateway, mapped to our own vocabulary. */
export type GatewayStatus = Exclude<TransactionStatus, "created">

export type GatewayCustomer = {
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
}

export type CheckoutRequest = {
  reference: string
  /** Whole rupiah. */
  amount: number
  customer: GatewayCustomer
  /** The storefront page the gateway sends the shopper back to. */
  returnUrl: string
  expiryMinutes: number
  paymentMethods: string[]
  notificationUrl?: string | null
  itemName: string
}

export type CheckoutResult = {
  redirectUrl: string
  token?: string
  expiresAt: Date | null
}

export type StatusResult = {
  status: GatewayStatus
  gatewayStatus: string | null
  paymentMethod: string | null
  paidAt: Date | null
  raw: Record<string, unknown> | null
}

export type ConnectionResult = { ok: boolean; message: string }

/** One merchant account at one gateway, ready to call. */
export interface GatewayClient {
  createCheckout(request: CheckoutRequest): Promise<CheckoutResult>
  getStatus(reference: string): Promise<StatusResult>
  /** Stops an unpaid charge so an abandoned VA can't be paid any more. */
  expire?(reference: string): Promise<void>
  /** Captures a card payment that was only authorized. */
  capture?(reference: string, amount: number, raw: Record<string, unknown> | null): Promise<void>
  refund?(reference: string, amount: number, reason: string): Promise<Record<string, unknown>>
  testConnection(): Promise<ConnectionResult>
}

export class GatewayRequestError extends Error {
  constructor(message: string, readonly httpStatus: number | null, readonly body: unknown) {
    super(message)
    this.name = "GatewayRequestError"
  }
}

const TIMEOUT_MS = 20000

/** fetch + JSON body, with a timeout. Never throws on HTTP errors. */
export const requestJson = async (
  url: string,
  init: RequestInit
): Promise<{ status: number; body: Record<string, unknown> | null }> => {
  let response: Response
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(TIMEOUT_MS) })
  } catch (error) {
    throw new GatewayRequestError(
      `could not reach ${new URL(url).host} (${error instanceof Error ? error.message : String(error)})`,
      null,
      null
    )
  }
  const text = await response.text()
  let body: Record<string, unknown> | null = null
  try {
    body = text ? (JSON.parse(text) as Record<string, unknown>) : null
  } catch {
    body = { raw: text.slice(0, 500) }
  }
  return { status: response.status, body }
}

/**
 * A new gateway order id / invoice number: upper-case letters and digits, 22
 * characters. Fits Midtrans (50) and DOKU (30 with cards, no symbols).
 */
export const newReference = () =>
  `PG${Date.now().toString(36).toUpperCase()}${randomBytes(6).toString("hex").toUpperCase()}`

export const fullName = (customer: GatewayCustomer) =>
  [customer.first_name, customer.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")

/** Indonesian numbers as the gateways want them: 62812..., digits only. */
export const normalizePhone = (phone: string | null | undefined) => {
  const digits = (phone ?? "").replace(/\D/g, "")
  if (!digits) {
    return undefined
  }
  return digits.startsWith("0") ? `62${digits.slice(1)}` : digits
}
