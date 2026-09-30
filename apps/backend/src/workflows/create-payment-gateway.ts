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
import { createPaymentGatewayStep } from "./steps/create-payment-gateway"
import { enablePaymentProviderInRegionsStep } from "./steps/enable-payment-provider-in-regions"
import { setPaymentGatewaySalesChannelsStep } from "./steps/set-payment-gateway-sales-channels"

type CreatePaymentGatewayWorkflowInput = {
  gateway: PaymentGatewayData
  credentials: CredentialsPatch
  sales_channel_ids?: string[]
}

export const createPaymentGatewayWorkflow = createWorkflow(
  "create-payment-gateway",
  (input: CreatePaymentGatewayWorkflowInput) => {
    const gateway = createPaymentGatewayStep({
      gateway: input.gateway,
      credentials: input.credentials,
    })

    const channels = transform({ gateway, input }, (data) => ({
      gateway_id: data.gateway.id,
      sales_channel_ids: data.input.sales_channel_ids ?? [],
    }))
    setPaymentGatewaySalesChannelsStep(channels)

    const provider = transform({ input }, (data) => ({
      provider_id: PROVIDER_IDS[data.input.gateway.provider],
    }))
    enablePaymentProviderInRegionsStep(provider)

    return new WorkflowResponse(gateway)
  }
)
