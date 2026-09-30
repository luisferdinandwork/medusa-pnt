import { MedusaService } from "@medusajs/framework/utils"
import PaymentGateway from "./models/payment-gateway"
import PaymentGatewayTransaction from "./models/payment-gateway-transaction"

class PaymentGatewayModuleService extends MedusaService({
  PaymentGateway,
  PaymentGatewayTransaction,
}) {}

export default PaymentGatewayModuleService
