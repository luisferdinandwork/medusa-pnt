import { CreditCard } from "@medusajs/icons"
import Bancontact from "@modules/common/icons/bancontact"
import Ideal from "@modules/common/icons/ideal"
import PayPal from "@modules/common/icons/paypal"
import React from "react"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentInfoMap: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_medusa-payments_default": {
    title: "Credit card",
    icon: <CreditCard />,
  },
  "pp_stripe-ideal_stripe": {
    title: "iDeal",
    icon: <Ideal />,
  },
  "pp_stripe-bancontact_stripe": {
    title: "Bancontact",
    icon: <Bancontact />,
  },
  pp_paypal_paypal: {
    title: "PayPal",
    icon: <PayPal />,
  },
  pp_system_default: {
    title: "Pembayaran (mode uji)",
    icon: <CreditCard />,
  },
  // Fallbacks: the checkout shows each gateway's own name from the admin.
  pp_midtrans_midtrans: {
    title: "Midtrans",
    icon: <CreditCard />,
  },
  pp_doku_doku: {
    title: "DOKU",
    icon: <CreditCard />,
  },
  // Add more payment providers here
}

/**
 * Midtrans / DOKU: hosted payment pages configured in the admin under
 * Storefronts > Payments. Each is offered as its own option (a "gateway"),
 * and the shopper pays on the gateway's page.
 */
export const isGatewayProvider = (providerId?: string) =>
  !!providerId &&
  (providerId.startsWith("pp_midtrans_") || providerId.startsWith("pp_doku_"))

/** "bca_va" -> "BCA VA", "VIRTUAL_ACCOUNT_BCA" -> "Virtual Account BCA". */
export const formatGatewayMethod = (code?: string | null) =>
  (code ?? "")
    .split("_")
    .filter(Boolean)
    .map((word) =>
      word.length <= 4 && !/^(bill|card)$/i.test(word)
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ")

// This only checks if it is native stripe or medusa payments for card payments, it ignores the other stripe-based providers
export const isStripeLike = (providerId?: string) => {
  return (
    providerId?.startsWith("pp_stripe_") || providerId?.startsWith("pp_medusa-")
  )
}

export const isPaypal = (providerId?: string) => {
  return providerId?.startsWith("pp_paypal")
}
export const isManual = (providerId?: string) => {
  return providerId?.startsWith("pp_system_default")
}

// Add currencies that don't need to be divided by 100
export const noDivisionCurrencies = [
  "krw",
  "jpy",
  "vnd",
  "clp",
  "pyg",
  "xaf",
  "xof",
  "bif",
  "djf",
  "gnf",
  "kmf",
  "mga",
  "rwf",
  "xpf",
  "htg",
  "vuv",
  "xag",
  "xdr",
  "xau",
]
