export type GatewayProvider = "midtrans" | "doku"
export type GatewayEnvironment = "sandbox" | "production"

export type CredentialState =
  | { set: boolean; value: string | null }
  | { set: boolean; last4: string | null }

export type PaymentGateway = {
  id: string
  name: string
  description: string | null
  provider: GatewayProvider
  provider_id: string
  environment: GatewayEnvironment
  is_active: boolean
  rank: number
  payment_methods: string[] | null
  expiry_minutes: number
  success_url: string | null
  pending_url: string | null
  failure_url: string | null
  notification_url: string | null
  webhook_path: string
  credentials: Record<string, CredentialState>
  missing_credentials: string[]
  sales_channels: { id: string; name: string }[]
  created_at: string
  updated_at: string
}

export type GatewayTransaction = {
  id: string
  reference: string
  session_id: string
  cart_id: string | null
  amount: number
  currency_code: string
  status: "created" | "pending" | "authorized" | "paid" | "failed" | "expired" | "canceled" | "refunded"
  gateway_status: string | null
  payment_method: string | null
  expires_at: string | null
  paid_at: string | null
  created_at: string
}

export type SalesChannelOption = { id: string; name: string; is_disabled?: boolean }

export const gatewaysQueryKey = ["payment-gateways"] as const
export const gatewayQueryKey = (id: string) => ["payment-gateways", id] as const

type CredentialField = {
  key: string
  label: string
  secret: boolean
  required: boolean
  placeholder: string
  hint: string
}

type ProviderInfo = {
  label: string
  tagline: string
  defaultName: string
  defaultDescription: string
  dashboard: Record<GatewayEnvironment, string>
  keysWhere: string
  credentials: CredentialField[]
  // The gateway's own method codes: Midtrans `enabled_payments`, DOKU
  // `payment_method_types`.
  methods: { code: string; label: string; group: string }[]
  webhookHelp: string
}

export const PROVIDERS: Record<GatewayProvider, ProviderInfo> = {
  midtrans: {
    label: "Midtrans",
    tagline: "Snap payment page: VA, e-wallets, QRIS, cards, retail outlets, pay later.",
    defaultName: "Midtrans",
    defaultDescription: "Transfer bank (VA), GoPay, ShopeePay, QRIS, kartu kredit",
    dashboard: {
      sandbox: "https://dashboard.sandbox.midtrans.com",
      production: "https://dashboard.midtrans.com",
    },
    keysWhere: "Midtrans dashboard > Settings > Access Keys",
    credentials: [
      {
        key: "merchant_id",
        label: "Merchant ID",
        secret: false,
        required: false,
        placeholder: "G123456789",
        hint: "Shown next to the keys. For reference only.",
      },
      {
        key: "client_key",
        label: "Client key",
        secret: false,
        required: false,
        placeholder: "SB-Mid-client-...",
        hint: "Public key. Not needed for the redirect flow; kept for Snap.js pop-ups.",
      },
      {
        key: "server_key",
        label: "Server key",
        secret: true,
        required: true,
        placeholder: "SB-Mid-server-...",
        hint: "Secret. Stored encrypted and never shown again.",
      },
    ],
    methods: [
      { code: "bca_va", label: "BCA Virtual Account", group: "Bank transfer" },
      { code: "bni_va", label: "BNI Virtual Account", group: "Bank transfer" },
      { code: "bri_va", label: "BRI Virtual Account", group: "Bank transfer" },
      { code: "permata_va", label: "Permata Virtual Account", group: "Bank transfer" },
      { code: "cimb_va", label: "CIMB Virtual Account", group: "Bank transfer" },
      { code: "echannel", label: "Mandiri Bill Payment", group: "Bank transfer" },
      { code: "other_va", label: "Other banks (ATM Bersama, Prima, Alto)", group: "Bank transfer" },
      { code: "gopay", label: "GoPay", group: "E-wallet & QRIS" },
      { code: "shopeepay", label: "ShopeePay", group: "E-wallet & QRIS" },
      { code: "other_qris", label: "QRIS", group: "E-wallet & QRIS" },
      { code: "credit_card", label: "Credit / debit card", group: "Card" },
      { code: "indomaret", label: "Indomaret", group: "Retail outlet" },
      { code: "alfamart", label: "Alfamart", group: "Retail outlet" },
      { code: "akulaku", label: "Akulaku PayLater", group: "Pay later" },
      { code: "kredivo", label: "Kredivo", group: "Pay later" },
    ],
    webhookHelp:
      "Midtrans dashboard > Settings > Payment > Notification URL. Also set Finish, Unfinish and Error Redirect URL to the storefront's return page (e.g. https://your-store/api/payment-gateway/return); each checkout already sends its own, these are the fallback.",
  },
  doku: {
    label: "DOKU",
    tagline: "DOKU Checkout page: VA, e-wallets, QRIS, cards, Alfamart, pay later.",
    defaultName: "DOKU",
    defaultDescription: "Transfer bank (VA), OVO, DANA, ShopeePay, QRIS, kartu kredit",
    dashboard: {
      sandbox: "https://sandbox.doku.com/bo/login",
      production: "https://dashboard.doku.com/bo/login",
    },
    keysWhere: "DOKU Back Office > Integration > API Keys",
    credentials: [
      {
        key: "client_id",
        label: "Client ID",
        secret: false,
        required: true,
        placeholder: "BRN-0123-1234567890123",
        hint: "Public identifier of the merchant account.",
      },
      {
        key: "secret_key",
        label: "Secret key",
        secret: true,
        required: true,
        placeholder: "SK-...",
        hint: "Secret. Stored encrypted and never shown again.",
      },
    ],
    methods: [
      { code: "VIRTUAL_ACCOUNT_BCA", label: "BCA Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BANK_MANDIRI", label: "Mandiri Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BRI", label: "BRI Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BNI", label: "BNI Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BANK_PERMATA", label: "Permata Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BANK_CIMB", label: "CIMB Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BANK_DANAMON", label: "Danamon Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI", label: "BSI Virtual Account", group: "Bank transfer" },
      { code: "VIRTUAL_ACCOUNT_DOKU", label: "DOKU Virtual Account", group: "Bank transfer" },
      { code: "EMONEY_OVO", label: "OVO", group: "E-wallet & QRIS" },
      { code: "EMONEY_DANA", label: "DANA", group: "E-wallet & QRIS" },
      { code: "EMONEY_SHOPEEPAY", label: "ShopeePay", group: "E-wallet & QRIS" },
      { code: "QRIS", label: "QRIS", group: "E-wallet & QRIS" },
      { code: "CREDIT_CARD", label: "Credit / debit card", group: "Card" },
      { code: "DIRECT_DEBIT_BRI", label: "BRI Direct Debit", group: "Card" },
      { code: "ONLINE_TO_OFFLINE_ALFA", label: "Alfamart", group: "Retail outlet" },
      { code: "PEER_TO_PEER_AKULAKU", label: "Akulaku", group: "Pay later" },
      { code: "PEER_TO_PEER_KREDIVO", label: "Kredivo", group: "Pay later" },
      { code: "PEER_TO_PEER_INDODANA", label: "Indodana", group: "Pay later" },
    ],
    webhookHelp:
      "DOKU Back Office > Settings > Payment Settings: set the Notification URL of each payment channel (for DOKU Checkout, Settings > Checkout Page Notifications).",
  },
}

// Mirrors DEFAULT_REDIRECTS in the payment_gateway module.
export const DEFAULT_REDIRECTS = {
  success_url: "/{country_code}/order/{order_id}/confirmed",
  pending_url: "/{country_code}/checkout/payment-pending",
  failure_url: "/{country_code}/checkout?step=payment&payment_status=failed",
}

export const STATUS_COLOR: Record<GatewayTransaction["status"], "green" | "orange" | "red" | "grey" | "blue"> = {
  created: "grey",
  pending: "orange",
  authorized: "blue",
  paid: "green",
  failed: "red",
  expired: "grey",
  canceled: "grey",
  refunded: "blue",
}

export const backendUrl = () =>
  (import.meta.env.VITE_BACKEND_URL as string | undefined)?.replace(/\/$/, "") ||
  window.location.origin
