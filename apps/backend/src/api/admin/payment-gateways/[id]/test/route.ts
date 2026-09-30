import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { gatewayClient } from "../../../../../lib/payment-gateways"
import { PAYMENT_GATEWAY_MODULE } from "../../../../../modules/payment-gateway"
import PaymentGatewayModuleService from "../../../../../modules/payment-gateway/service"

// Checks the saved keys against the gateway's API (a status lookup for an
// order that does not exist), without creating a payment.
export const POST = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: PaymentGatewayModuleService = req.scope.resolve(PAYMENT_GATEWAY_MODULE)
  const gateway = await service.retrievePaymentGateway(req.params.id)

  try {
    const result = await gatewayClient(gateway).testConnection()
    res.json({ ...result, environment: gateway.environment })
  } catch (error) {
    res.json({
      ok: false,
      environment: gateway.environment,
      message: error instanceof Error ? error.message : String(error),
    })
  }
}
