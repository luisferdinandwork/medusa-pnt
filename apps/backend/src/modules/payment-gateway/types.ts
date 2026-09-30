export const GATEWAY_PROVIDERS = ["midtrans", "doku"] as const
export const GATEWAY_ENVIRONMENTS = ["sandbox", "production"] as const

// Normalized transaction status, the same for every gateway.
export const TRANSACTION_STATUSES = [
  "created",
  "pending",
  "authorized",
  "paid",
  "failed",
  "expired",
  "canceled",
  "refunded",
] as const

export type GatewayProvider = (typeof GATEWAY_PROVIDERS)[number]
export type GatewayEnvironment = (typeof GATEWAY_ENVIRONMENTS)[number]
export type TransactionStatus = (typeof TRANSACTION_STATUSES)[number]

// Each gateway runs on a Medusa payment provider registered in
// medusa-config.ts (`pp_<identifier>_<id>`). Several gateways can share one
// provider, e.g. two Midtrans accounts for two storefronts.
export const PROVIDER_IDS: Record<GatewayProvider, string> = {
  midtrans: "pp_midtrans_midtrans",
  doku: "pp_doku_doku",
}

export const gatewayProviderOf = (
  providerId: string | null | undefined
): GatewayProvider | undefined =>
  GATEWAY_PROVIDERS.find((provider) => PROVIDER_IDS[provider] === providerId)

/** Path of the Medusa webhook route the gateway posts its notifications to. */
export const webhookPath = (provider: GatewayProvider) =>
  `/hooks/payment/${provider}_${provider}`

export type CredentialField = {
  key: string
  label: string
  secret: boolean
  required: boolean
}

// Secret fields are encrypted at rest and never returned by the API; the
// others (client key, merchant id) are public identifiers.
export const CREDENTIAL_FIELDS: Record<GatewayProvider, CredentialField[]> = {
  midtrans: [
    { key: "merchant_id", label: "Merchant ID", secret: false, required: false },
    { key: "client_key", label: "Client key", secret: false, required: false },
    { key: "server_key", label: "Server key", secret: true, required: true },
  ],
  doku: [
    { key: "client_id", label: "Client ID", secret: false, required: true },
    { key: "secret_key", label: "Secret key", secret: true, required: true },
  ],
}

export type StoredSecret = { enc: string; last4: string }
export type StoredCredentials = Record<string, string | StoredSecret>

// Where the shopper lands once the storefront has checked the payment with
// the gateway. A path is opened on the storefront the shopper is on; a full
// URL is opened as is. {country_code}, {order_id} and {cart_id} are filled in.
export const DEFAULT_REDIRECTS = {
  success_url: "/{country_code}/order/{order_id}/confirmed",
  pending_url: "/{country_code}/checkout/payment-pending",
  failure_url: "/{country_code}/checkout?step=payment&payment_status=failed",
}

export const DEFAULT_EXPIRY_MINUTES = 60 * 24

export const GATEWAY_FIELDS = [
  "name",
  "description",
  "provider",
  "environment",
  "is_active",
  "rank",
  "credentials",
  "payment_methods",
  "expiry_minutes",
  "success_url",
  "pending_url",
  "failure_url",
  "notification_url",
] as const

export type PaymentGatewayData = {
  name: string
  description?: string | null
  provider: GatewayProvider
  environment?: GatewayEnvironment
  is_active?: boolean
  rank?: number
  payment_methods?: string[] | null
  expiry_minutes?: number
  success_url?: string | null
  pending_url?: string | null
  failure_url?: string | null
  notification_url?: string | null
}

/**
 * Credential changes from the admin, secrets already encrypted. A missing key
 * keeps the stored value, null removes it.
 */
export type CredentialsPatch = Record<string, string | StoredSecret | null>

// The data model types json columns as objects; payment_methods holds an array.
export const toModelData = <T extends object>(data: T) =>
  data as unknown as Omit<T, "payment_methods"> & {
    payment_methods?: Record<string, unknown> | null
  }
