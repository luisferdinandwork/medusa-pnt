import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  type CredentialsPatch,
  type PaymentGatewayData,
  PROVIDER_IDS,
} from "../modules/payment-gateway/types"
import { enablePaymentProviderInRegionsStep } from "./steps/enable-payment-provider-in-regions"
import { setPaymentGatewaySalesChannelsStep } from "./steps/set-payment-gateway-sales-channels"
import { updatePaymentGatewayStep } from "./steps/update-payment-gateway"

type UpdatePaymentGatewayWorkflowInput = {
  id: string
  data: Partial<Omit<PaymentGatewayData, "provider">>
  credentials?: CredentialsPatch
  // Undefined leaves the sales channels as they are.
  sales_channel_ids?: string[]
}

export const updatePaymentGatewayWorkflow = createWorkflow(
  "update-payment-gateway",
  (input: UpdatePaymentGatewayWorkflowInput) => {
    const gateway = updatePaymentGatewayStep({
      id: input.id,
      data: input.data,
      credentials: input.credentials,
    })

    setPaymentGatewaySalesChannelsStep({
      gateway_id: input.id,
      sales_channel_ids: input.sales_channel_ids,
    })

    const provider = transform({ gateway }, (data) => ({
      provider_id: PROVIDER_IDS[data.gateway.provider],
    }))
    enablePaymentProviderInRegionsStep(provider)

    return new WorkflowResponse(gateway)
  }
)
