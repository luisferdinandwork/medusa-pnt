import { model } from "@medusajs/framework/utils"
import {
  DEFAULT_EXPIRY_MINUTES,
  GATEWAY_ENVIRONMENTS,
  GATEWAY_PROVIDERS,
} from "../types"

// One payment method offered at checkout (e.g. "Midtrans" or "Transfer bank
// via DOKU"), with the merchant account it charges. The sales channels that
// offer it are a module link, so each storefront shows only its own gateways.
const PaymentGateway = model.define("payment_gateway", {
  id: model.id({ prefix: "pgw" }).primaryKey(),
  // Shown to shoppers at checkout.
  name: model.text(),
  description: model.text().nullable(),
  provider: model.enum([...GATEWAY_PROVIDERS]),
  environment: model.enum([...GATEWAY_ENVIRONMENTS]).default("sandbox"),
  is_active: model.boolean().default(false),
  // Order of the options at checkout.
  rank: model.number().default(0),

  // StoredCredentials: public ids as text, secrets as { enc, last4 }
  // (AES-256-GCM, see src/lib/payment-gateways/credentials.ts).
  credentials: model.json().nullable(),

  // string[]: the gateway's own method codes (Midtrans `enabled_payments`,
  // DOKU `payment_method_types`). Empty offers every method the account has.
  payment_methods: model.json().nullable(),
  // How long the shopper has to pay (VA, QRIS, ...), in minutes.
  expiry_minutes: model.number().default(DEFAULT_EXPIRY_MINUTES),

  // Where the shopper lands after the storefront checked the payment. Empty
  // uses DEFAULT_REDIRECTS.
  success_url: model.text().nullable(),
  pending_url: model.text().nullable(),
  failure_url: model.text().nullable(),
  // Sends this gateway's notifications to another URL than the one set in the
  // gateway dashboard (e.g. a tunnel to a local backend).
  notification_url: model.text().nullable(),
})

export default PaymentGateway
