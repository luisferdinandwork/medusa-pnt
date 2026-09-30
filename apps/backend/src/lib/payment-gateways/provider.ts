import type {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  BigNumberInput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types"
import {
  AbstractPaymentProvider,
  BigNumber,
  MedusaError,
  PaymentActions,
  PaymentSessionStatus,
} from "@medusajs/framework/utils"
import { PAYMENT_GATEWAY_MODULE } from "../../modules/payment-gateway"
import type PaymentGatewayModuleService from "../../modules/payment-gateway/service"
import {
  DEFAULT_REDIRECTS,
  type GatewayEnvironment,
  type GatewayProvider,
  type StoredCredentials,
} from "../../modules/payment-gateway/types"
import { type GatewayRecord, gatewayClient } from "."
import {
  type GatewayCustomer,
  type GatewayStatus,
  newReference,
  type StatusResult,
} from "./common"
import { readCredentials } from "./credentials"

/**
 * What a gateway payment session carries. The storefront sends `gateway_id`,
 * `return_url` and `country_code`; the store middleware adds `cart_id` and
 * `customer`; the provider adds the rest. Everything here is visible to the
 * shopper, so it never holds a key.
 */
export type GatewaySessionData = {
  session_id?: string
  gateway_id?: string
  return_url?: string
  country_code?: string
  cart_id?: string
  customer?: GatewayCustomer
  provider?: GatewayProvider
  environment?: GatewayEnvironment
  gateway_name?: string
  reference?: string
  transaction_id?: string
  amount?: number
  redirect_url?: string
  snap_token?: string
  expires_at?: string | null
  redirects?: { success_url: string; pending_url: string; failure_url: string }
  status?: GatewayStatus
  gateway_status?: string | null
  payment_method?: string | null
  paid_at?: string | null
  refunds?: { amount: number; at: string; via: "gateway" | "manual" }[]
}

type WebhookPayload = ProviderWebhookPayload["payload"]

const SESSION_STATUS: Record<GatewayStatus, PaymentSessionStatus> = {
  pending: PaymentSessionStatus.PENDING,
  authorized: PaymentSessionStatus.AUTHORIZED,
  // Money is settled at the gateway, so Medusa records the payment as
  // captured straight away.
  paid: PaymentSessionStatus.CAPTURED,
  failed: PaymentSessionStatus.ERROR,
  expired: PaymentSessionStatus.CANCELED,
  canceled: PaymentSessionStatus.CANCELED,
  refunded: PaymentSessionStatus.CANCELED,
}

// Gateways take whole rupiah.
const toRupiah = (amount: BigNumberInput) => Math.round(new BigNumber(amount).numeric)

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error))

/**
 * A Medusa payment provider for a hosted-page gateway (Midtrans Snap, DOKU
 * Checkout). Keys and settings come from the payment_gateway module, chosen by
 * the session's `gateway_id`, so several merchant accounts can share one
 * provider. The payment module must list the module in its `dependencies`
 * (medusa-config.ts) for the provider to reach it.
 *
 * Flow: initiatePayment creates the charge and returns the page to redirect
 * to. authorizePayment asks the gateway whether it was paid (Medusa calls it
 * when the cart is completed). Notifications complete the cart on their own
 * when the shopper never comes back to the storefront.
 */
export abstract class GatewayPaymentProvider extends AbstractPaymentProvider {
  protected abstract readonly gatewayProvider: GatewayProvider

  // The payment module constructs providers with its container's cradle.
  constructor(cradle: Record<string, unknown>, options?: Record<string, unknown>) {
    super(cradle, options)
  }

  /** Reference and status from a notification body, before it is verified. */
  protected abstract parseNotification(
    payload: WebhookPayload
  ): { reference: string; status: StatusResult } | null

  protected abstract verifyNotification(
    payload: WebhookPayload,
    gateway: GatewayRecord,
    credentials: Record<string, string>
  ): boolean

  protected get logger(): Logger {
    return this.container.logger as Logger
  }

  protected get gateways(): PaymentGatewayModuleService {
    const service = this.container[PAYMENT_GATEWAY_MODULE] as
      | PaymentGatewayModuleService
      | undefined
    if (!service) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `The ${this.gatewayProvider} payment provider can't reach the payment_gateway module. Add dependencies: ["payment_gateway"] to the payment module in medusa-config.ts.`
      )
    }
    return service
  }

  private async loadGateway(id: string | undefined, { activeOnly }: { activeOnly: boolean }) {
    if (!id) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The payment session has no gateway_id."
      )
    }
    // Deleted gateways still verify payments that were started with them.
    const [gateway] = await this.gateways.listPaymentGateways(
      { id },
      { withDeleted: !activeOnly, take: 1 }
    )
    if (!gateway || gateway.provider !== this.gatewayProvider) {
      throw new MedusaError(MedusaError.Types.NOT_FOUND, `Payment gateway ${id} not found.`)
    }
    if (activeOnly && !gateway.is_active) {
      throw new MedusaError(
        MedusaError.Types.NOT_ALLOWED,
        `Metode pembayaran ${gateway.name} sedang tidak aktif.`
      )
    }
    return gateway
  }

  private async loadTransaction(reference: string | undefined) {
    if (!reference) {
      return undefined
    }
    const [transaction] = await this.gateways.listPaymentGatewayTransactions(
      { reference },
      { take: 1 }
    )
    return transaction
  }

  /** Creates a charge at the gateway for the session's current amount. */
  private async startCharge(
    data: GatewaySessionData,
    amountInput: BigNumberInput,
    currencyCode: string,
    sessionId: string | undefined
  ): Promise<GatewaySessionData> {
    const gateway = await this.loadGateway(data.gateway_id, { activeOnly: true })
    if (currencyCode.toLowerCase() !== "idr") {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${gateway.name} hanya menerima pembayaran dalam Rupiah (IDR).`
      )
    }
    if (!data.return_url) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "return_url is required: the storefront page the gateway sends the shopper back to."
      )
    }
    const amount = toRupiah(amountInput)
    if (amount <= 0) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "Nothing to pay.")
    }

    const client = gatewayClient(gateway)
    const reference = newReference()
    const transaction = await this.gateways.createPaymentGatewayTransactions({
      gateway_id: gateway.id,
      provider: this.gatewayProvider,
      reference,
      session_id: sessionId ?? "",
      cart_id: data.cart_id ?? null,
      amount,
      currency_code: "idr",
      status: "created",
    })

    let checkout
    try {
      checkout = await client.createCheckout({
        reference,
        amount,
        customer: data.customer ?? {},
        returnUrl: data.return_url,
        expiryMinutes: gateway.expiry_minutes,
        paymentMethods: (gateway.payment_methods as string[] | null) ?? [],
        notificationUrl: gateway.notification_url,
        itemName: "Total belanja",
      })
    } catch (error) {
      await this.gateways.updatePaymentGatewayTransactions({
        id: transaction.id,
        status: "failed",
        last_payload: { error: messageOf(error) },
      })
      this.logger.error(`${gateway.name}: could not create a payment (${messageOf(error)})`)
      // A 4xx so the shopper sees the reason (5xx messages are masked).
      throw new MedusaError(
        MedusaError.Types.PAYMENT_AUTHORIZATION_ERROR,
        `${gateway.name} tidak bisa membuat pembayaran: ${messageOf(error)}`
      )
    }

    await this.gateways.updatePaymentGatewayTransactions({
      id: transaction.id,
      status: "pending",
      redirect_url: checkout.redirectUrl,
      expires_at: checkout.expiresAt,
    })

    return {
      session_id: sessionId,
      gateway_id: gateway.id,
      return_url: data.return_url,
      country_code: data.country_code,
      cart_id: data.cart_id,
      customer: data.customer,
      provider: this.gatewayProvider,
      environment: gateway.environment,
      gateway_name: gateway.name,
      reference,
      transaction_id: transaction.id,
      amount,
      redirect_url: checkout.redirectUrl,
      ...(checkout.token ? { snap_token: checkout.token } : {}),
      expires_at: checkout.expiresAt?.toISOString() ?? null,
      redirects: {
        success_url: gateway.success_url || DEFAULT_REDIRECTS.success_url,
        pending_url: gateway.pending_url || DEFAULT_REDIRECTS.pending_url,
        failure_url: gateway.failure_url || DEFAULT_REDIRECTS.failure_url,
      },
      status: "pending",
    }
  }

  /**
   * The charge's status. A status a verified notification already recorded is
   * trusted as is (DOKU's status API can lag behind its notifications);
   * otherwise the gateway is asked and the answer recorded.
   */
  private async checkStatus(data: GatewaySessionData): Promise<StatusResult> {
    const transaction = await this.loadTransaction(data.reference)
    if (!transaction) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No gateway transaction for payment reference ${data.reference ?? "(none)"}.`
      )
    }
    if (transaction.status === "paid" || transaction.status === "refunded") {
      return {
        status: transaction.status,
        gatewayStatus: transaction.gateway_status,
        paymentMethod: transaction.payment_method,
        paidAt: transaction.paid_at ? new Date(transaction.paid_at) : null,
        raw: transaction.last_payload as Record<string, unknown> | null,
      }
    }

    const gateway = await this.loadGateway(transaction.gateway_id, { activeOnly: false })
    const result = await gatewayClient(gateway).getStatus(transaction.reference)
    await this.recordStatus(transaction.id, result)
    return result
  }

  private async recordStatus(transactionId: string, result: StatusResult) {
    await this.gateways.updatePaymentGatewayTransactions({
      id: transactionId,
      status: result.status,
      gateway_status: result.gatewayStatus,
      payment_method: result.paymentMethod,
      last_payload: result.raw,
      ...(result.paidAt ? { paid_at: result.paidAt } : {}),
    })
  }

  private withStatus(data: GatewaySessionData, result: StatusResult): GatewaySessionData {
    return {
      ...data,
      status: result.status,
      gateway_status: result.gatewayStatus,
      payment_method: result.paymentMethod ?? data.payment_method ?? null,
      paid_at: result.paidAt?.toISOString() ?? data.paid_at ?? null,
    }
  }

  /** Best effort: stop an unpaid charge so it can't be paid any more. */
  private async expireCharge(data: GatewaySessionData) {
    const transaction = await this.loadTransaction(data.reference)
    if (!transaction || !["created", "pending"].includes(transaction.status)) {
      return
    }
    try {
      const gateway = await this.loadGateway(transaction.gateway_id, { activeOnly: false })
      await gatewayClient(gateway).expire?.(transaction.reference)
      await this.gateways.updatePaymentGatewayTransactions({
        id: transaction.id,
        status: "canceled",
      })
    } catch (error) {
      this.logger.warn(
        `Could not expire payment ${transaction.reference} at the gateway: ${messageOf(error)}`
      )
    }
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const session = await this.startCharge(
      data,
      input.amount,
      input.currency_code,
      data.session_id ?? input.context?.idempotency_key
    )
    return {
      id: session.reference!,
      status: PaymentSessionStatus.PENDING,
      data: session,
    }
  }

  async updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const expired = !!data.expires_at && new Date(data.expires_at) <= new Date()
    if (data.reference && data.amount === toRupiah(input.amount) && !expired) {
      return { data, status: PaymentSessionStatus.PENDING }
    }
    // The amount is fixed once a charge exists, so a new amount needs a new one.
    await this.expireCharge(data)
    const session = await this.startCharge(
      data,
      input.amount,
      input.currency_code,
      data.session_id ?? input.context?.idempotency_key
    )
    return { data: session, status: PaymentSessionStatus.PENDING }
  }

  async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const result = await this.checkStatus(data)
    return {
      status: SESSION_STATUS[result.status],
      data: this.withStatus(data, result),
    }
  }

  async capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    // Hosted-page payments are settled when paid; only a card that was
    // authorized without capture (a Midtrans account setting) needs a call.
    if (data.status !== "authorized") {
      return { data }
    }
    const transaction = await this.loadTransaction(data.reference)
    if (!transaction) {
      return { data }
    }
    const gateway = await this.loadGateway(transaction.gateway_id, { activeOnly: false })
    const client = gatewayClient(gateway)
    if (!client.capture) {
      return { data }
    }
    await client.capture(
      transaction.reference,
      toRupiah(transaction.amount),
      transaction.last_payload as Record<string, unknown> | null
    )
    await this.gateways.updatePaymentGatewayTransactions({
      id: transaction.id,
      status: "paid",
      paid_at: new Date(),
    })
    return { data: { ...data, status: "paid", paid_at: new Date().toISOString() } }
  }

  async cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    await this.expireCharge(data)
    return { data }
  }

  async deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    // The shopper switched methods or the cart changed: make sure the old VA
    // or QR can't be paid any more.
    await this.expireCharge(data)
    return { data }
  }

  async refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const amount = toRupiah(input.amount)
    const transaction = await this.loadTransaction(data.reference)
    if (!transaction) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `No gateway transaction for payment reference ${data.reference ?? "(none)"}.`
      )
    }
    const gateway = await this.loadGateway(transaction.gateway_id, { activeOnly: false })
    const client = gatewayClient(gateway)

    let via: "gateway" | "manual" = "manual"
    if (client.refund) {
      try {
        await client.refund(transaction.reference, amount, "Refund from Medusa")
        via = "gateway"
      } catch (error) {
        throw new MedusaError(
          MedusaError.Types.NOT_ALLOWED,
          `${gateway.name} refused the refund: ${messageOf(error)}. Bank transfers (VA) and some other methods can't be refunded through the API; refund the customer yourself.`
        )
      }
    } else {
      this.logger.warn(
        `${gateway.name}: refund of ${amount} for ${transaction.reference} recorded in Medusa only. Issue it in the gateway's back office.`
      )
    }

    return {
      data: {
        ...data,
        refunds: [...(data.refunds ?? []), { amount, at: new Date().toISOString(), via }],
      },
    }
  }

  async retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const result = await this.checkStatus(data)
    return { data: this.withStatus(data, result) }
  }

  async getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    const data = (input.data ?? {}) as GatewaySessionData
    const result = await this.checkStatus(data)
    return { status: SESSION_STATUS[result.status], data: this.withStatus(data, result) }
  }

  async getWebhookActionAndData(payload: WebhookPayload): Promise<WebhookActionResult> {
    const parsed = this.parseNotification(payload)
    if (!parsed) {
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const transaction = await this.loadTransaction(parsed.reference)
    if (!transaction) {
      this.logger.warn(
        `${this.gatewayProvider} notification for unknown payment ${parsed.reference}, ignored.`
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    const gateway = await this.loadGateway(transaction.gateway_id, { activeOnly: false })
    const credentials = readCredentials(
      gateway.provider,
      gateway.credentials as StoredCredentials | null,
      gateway.name
    )
    if (!this.verifyNotification(payload, gateway, credentials)) {
      this.logger.warn(
        `${gateway.name}: notification for ${parsed.reference} has an invalid signature, ignored.`
      )
      return { action: PaymentActions.NOT_SUPPORTED }
    }

    await this.recordStatus(transaction.id, parsed.status)
    const data = {
      session_id: transaction.session_id,
      amount: new BigNumber(transaction.amount),
    }

    switch (parsed.status.status) {
      case "paid":
        return { action: PaymentActions.SUCCESSFUL, data }
      case "authorized":
        return { action: PaymentActions.AUTHORIZED, data }
      case "pending":
        return { action: PaymentActions.PENDING, data }
      case "failed":
      case "expired":
      case "canceled":
        return { action: PaymentActions.FAILED, data }
      default:
        return { action: PaymentActions.NOT_SUPPORTED }
    }
  }
}
