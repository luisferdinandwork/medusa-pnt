import { Module } from "@medusajs/framework/utils"
import PaymentGatewayModuleService from "./service"

export const PAYMENT_GATEWAY_MODULE = "payment_gateway"

export default Module(PAYMENT_GATEWAY_MODULE, {
  service: PaymentGatewayModuleService,
})
