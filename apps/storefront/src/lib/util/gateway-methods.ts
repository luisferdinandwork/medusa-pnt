import { formatGatewayMethod } from "@lib/constants"
import type { StorePaymentGateway } from "@lib/data/payment"

// Midtrans / DOKU payment methods as the checkout lists them. The codes are
// the gateways' own (Midtrans `enabled_payments`, DOKU `payment_method_types`),
// the same ones ticked under Storefronts > Payments in the admin
// (src/admin/components/payments/types.ts in the backend).

export type GatewayMethodGroup = "va" | "ewallet" | "card" | "retail" | "paylater"

/** Checkout order of the method groups. */
export const GATEWAY_METHOD_GROUPS: { id: GatewayMethodGroup; title: string }[] = [
  { id: "va", title: "Transfer Bank (Virtual Account)" },
  { id: "ewallet", title: "E-Wallet & QRIS" },
  { id: "card", title: "Kartu Kredit / Debit" },
  { id: "retail", title: "Gerai Retail" },
  { id: "paylater", title: "Bayar Nanti" },
]

type MethodInfo = { label: string; group: GatewayMethodGroup }

const METHODS: Record<string, MethodInfo> = {
  // Midtrans
  bca_va: { label: "BCA Virtual Account", group: "va" },
  bni_va: { label: "BNI Virtual Account", group: "va" },
  bri_va: { label: "BRI Virtual Account", group: "va" },
  echannel: { label: "Mandiri Bill Payment", group: "va" },
  permata_va: { label: "Permata Virtual Account", group: "va" },
  cimb_va: { label: "CIMB Niaga Virtual Account", group: "va" },
  other_va: { label: "Bank lain (ATM Bersama, Prima, Alto)", group: "va" },
  gopay: { label: "GoPay", group: "ewallet" },
  shopeepay: { label: "ShopeePay", group: "ewallet" },
  other_qris: { label: "QRIS", group: "ewallet" },
  credit_card: { label: "Kartu Kredit / Debit", group: "card" },
  indomaret: { label: "Indomaret", group: "retail" },
  alfamart: { label: "Alfamart", group: "retail" },
  akulaku: { label: "Akulaku PayLater", group: "paylater" },
  kredivo: { label: "Kredivo", group: "paylater" },
  // DOKU
  VIRTUAL_ACCOUNT_BCA: { label: "BCA Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BANK_MANDIRI: { label: "Mandiri Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BRI: { label: "BRI Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BNI: { label: "BNI Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BANK_PERMATA: { label: "Permata Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BANK_CIMB: { label: "CIMB Niaga Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BANK_DANAMON: { label: "Danamon Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI: { label: "BSI Virtual Account", group: "va" },
  VIRTUAL_ACCOUNT_DOKU: { label: "DOKU Virtual Account", group: "va" },
  EMONEY_OVO: { label: "OVO", group: "ewallet" },
  EMONEY_DANA: { label: "DANA", group: "ewallet" },
  EMONEY_SHOPEEPAY: { label: "ShopeePay", group: "ewallet" },
  QRIS: { label: "QRIS", group: "ewallet" },
  CREDIT_CARD: { label: "Kartu Kredit / Debit", group: "card" },
  DIRECT_DEBIT_BRI: { label: "BRI Direct Debit", group: "card" },
  ONLINE_TO_OFFLINE_ALFA: { label: "Alfamart", group: "retail" },
  PEER_TO_PEER_AKULAKU: { label: "Akulaku", group: "paylater" },
  PEER_TO_PEER_KREDIVO: { label: "Kredivo", group: "paylater" },
  PEER_TO_PEER_INDODANA: { label: "Indodana", group: "paylater" },
}

// Codes Midtrans reports for a paid charge that differ from the checkout
// codes (shown on the waiting page and the order page).
const REPORTED: Record<string, string> = {
  mandiri_bill: "Mandiri Bill Payment",
  qris: "QRIS",
  cstore: "Gerai retail",
  bank_transfer: "Transfer bank",
}

const METHOD_ORDER = Object.keys(METHODS)

/** "bca_va" -> "BCA Virtual Account"; unknown codes are prettified. */
export const gatewayMethodLabel = (code?: string | null) =>
  code ? METHODS[code]?.label ?? REPORTED[code] ?? formatGatewayMethod(code) : ""

export type GatewayOption = {
  /** RadioGroup value: the gateway id, plus the method code for a single method. */
  value: string
  gateway: StorePaymentGateway
  /** Null when the shopper picks the method on the gateway's page. */
  method: string | null
  title: string
  description: string | null
  /** Null for a whole gateway or a method code this list doesn't know. */
  group: GatewayMethodGroup | null
}

/**
 * The checkout options for the storefront's gateways: one per payment method
 * the gateway allows, or one for the whole gateway when it allows every
 * method on the account (the admin's "Every method active on the account").
 */
export const buildGatewayOptions = (gateways: StorePaymentGateway[]): GatewayOption[] => {
  const byCatalogOrder = (a: string, b: string) => {
    const rank = (code: string) => {
      const index = METHOD_ORDER.indexOf(code)
      return index === -1 ? METHOD_ORDER.length : index
    }
    return rank(a) - rank(b)
  }

  const options = gateways.flatMap((gateway): GatewayOption[] =>
    gateway.payment_methods.length
      ? [...gateway.payment_methods].sort(byCatalogOrder).map((method) => ({
          value: `${gateway.id}:${method}`,
          gateway,
          method,
          title: gatewayMethodLabel(method),
          description: null,
          group: METHODS[method]?.group ?? null,
        }))
      : [
          {
            value: gateway.id,
            gateway,
            method: null,
            title: gateway.name,
            description: gateway.description,
            group: null,
          },
        ]
  )

  // The same method offered by two gateways: tell them apart by gateway name.
  const titles = new Map<string, number>()
  for (const option of options) {
    if (option.method) {
      titles.set(option.title, (titles.get(option.title) ?? 0) + 1)
    }
  }
  return options.map((option) =>
    option.method && (titles.get(option.title) ?? 0) > 1
      ? { ...option, description: option.gateway.name }
      : option
  )
}
