import { model } from "@medusajs/framework/utils"
import { GATEWAY_PROVIDERS, TRANSACTION_STATUSES } from "../types"

// One charge created at a gateway (a Midtrans order id or a DOKU invoice
// number) for a Medusa payment session. A session gets a new one whenever its
// amount changes. Notifications are matched by `reference`, which also tells
// which gateway's keys verify them.
const PaymentGatewayTransaction = model
  .define("payment_gateway_transaction", {
    id: model.id({ prefix: "pgtx" }).primaryKey(),
    gateway_id: model.text(),
    provider: model.enum([...GATEWAY_PROVIDERS]),
    // Sent to the gateway as order id / invoice number: upper-case letters and
    // digits only, at most 30 characters (DOKU's limit with cards enabled).
    reference: model.text().unique(),
    session_id: model.text(),
    cart_id: model.text().nullable(),
    amount: model.bigNumber(),
    currency_code: model.text(),
    status: model.enum([...TRANSACTION_STATUSES]).default("created"),
    // The gateway's own status and payment method, e.g. "settlement" / "bca_va".
    gateway_status: model.text().nullable(),
    payment_method: model.text().nullable(),
    redirect_url: model.text().nullable(),
    expires_at: model.dateTime().nullable(),
    paid_at: model.dateTime().nullable(),
    // Last status response or notification body, for support.
    last_payload: model.json().nullable(),
  })
  .indexes([
    { on: ["gateway_id", "created_at"], where: "deleted_at IS NULL" },
    { on: ["session_id"], where: "deleted_at IS NULL" },
  ])

export default PaymentGatewayTransaction
