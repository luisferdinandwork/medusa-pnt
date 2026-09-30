import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { PAYMENT_GATEWAY_MODULE } from "../../modules/payment-gateway"
import PaymentGatewayModuleService from "../../modules/payment-gateway/service"

// Soft delete: payments started with the gateway can still be verified and
// completed by its notifications.
export const deletePaymentGatewayStep = createStep(
  "delete-payment-gateway",
  async (id: string, { container }) => {
    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)
    await service.softDeletePaymentGateways(id)
    return new StepResponse(void 0, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)
    await service.restorePaymentGateways(id)
  }
)
