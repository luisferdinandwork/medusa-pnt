import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deletePaymentGatewayStep } from "./steps/delete-payment-gateway"
import { setPaymentGatewaySalesChannelsStep } from "./steps/set-payment-gateway-sales-channels"

export const deletePaymentGatewayWorkflow = createWorkflow(
  "delete-payment-gateway",
  (input: { id: string }) => {
    // Off every storefront first, so no new checkout can pick it.
    setPaymentGatewaySalesChannelsStep({
      gateway_id: input.id,
      sales_channel_ids: [],
    })
    deletePaymentGatewayStep(input.id)
    return new WorkflowResponse(void 0)
  }
)
