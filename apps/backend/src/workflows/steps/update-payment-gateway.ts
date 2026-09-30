import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { mergeCredentials, missingCredentials } from "../../lib/payment-gateways/credentials"
import { PAYMENT_GATEWAY_MODULE } from "../../modules/payment-gateway"
import PaymentGatewayModuleService from "../../modules/payment-gateway/service"
import {
  type CredentialsPatch,
  GATEWAY_FIELDS,
  type PaymentGatewayData,
  type StoredCredentials,
  toModelData,
} from "../../modules/payment-gateway/types"

export type UpdatePaymentGatewayStepInput = {
  id: string
  // The provider (Midtrans/DOKU) is fixed once created: its keys belong to it.
  data: Partial<Omit<PaymentGatewayData, "provider">>
  credentials?: CredentialsPatch
}

export const updatePaymentGatewayStep = createStep(
  "update-payment-gateway",
  async ({ id, data, credentials }: UpdatePaymentGatewayStepInput, { container }) => {
    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)
    const previous = await service.retrievePaymentGateway(id)
    const snapshot = Object.fromEntries(
      GATEWAY_FIELDS.map((field) => [field, previous[field]])
    )

    const stored = mergeCredentials(
      previous.credentials as StoredCredentials | null,
      credentials ?? {}
    )
    const missing = missingCredentials(previous.provider, stored)
    if ((data.is_active ?? previous.is_active) && missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Enter the ${missing.join(" and ")} before turning the gateway on.`
      )
    }

    const updated = await service.updatePaymentGateways({
      id,
      ...toModelData(data),
      credentials: stored,
    })
    return new StepResponse(updated, { id, snapshot })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)
    await service.updatePaymentGateways({ id: compensation.id, ...compensation.snapshot })
  }
)
