import { defineLink } from "@medusajs/framework/utils"
import SalesChannelModule from "@medusajs/medusa/sales-channel"
import StorefrontModule from "../modules/storefront"

export default defineLink(
  StorefrontModule.linkable.storefront,
  SalesChannelModule.linkable.salesChannel
)
