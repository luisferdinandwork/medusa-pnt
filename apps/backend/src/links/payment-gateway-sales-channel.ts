import { defineLink } from "@medusajs/framework/utils"
import SalesChannelModule from "@medusajs/medusa/sales-channel"
import PaymentGatewayModule from "../modules/payment-gateway"

// The sales channels (storefronts) that offer a payment gateway at checkout.
// Many-to-many: a gateway can serve several storefronts, and a storefront can
// offer several gateways.
export default defineLink(
  { linkable: PaymentGatewayModule.linkable.paymentGateway, isList: true },
  { linkable: SalesChannelModule.linkable.salesChannel, isList: true }
)
