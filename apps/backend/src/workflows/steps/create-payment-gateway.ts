import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { mergeCredentials, missingCredentials } from "../../lib/payment-gateways/credentials"
import { PAYMENT_GATEWAY_MODULE } from "../../modules/payment-gateway"
import PaymentGatewayModuleService from "../../modules/payment-gateway/service"
import {
  type CredentialsPatch,
  type PaymentGatewayData,
  toModelData,
} from "../../modules/payment-gateway/types"

export type CreatePaymentGatewayStepInput = {
  gateway: PaymentGatewayData
  credentials: CredentialsPatch
}

export const createPaymentGatewayStep = createStep(
  "create-payment-gateway",
  async ({ gateway, credentials }: CreatePaymentGatewayStepInput, { container }) => {
    const stored = mergeCredentials(null, credentials)
    const missing = missingCredentials(gateway.provider, stored)
    if (gateway.is_active && missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Enter the ${missing.join(" and ")} before turning the gateway on.`
      )
    }

    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)

    // A new gateway goes last at checkout unless a rank is given.
    let rank = gateway.rank
    if (rank === undefined) {
      const [last] = await service.listPaymentGateways({}, { order: { rank: "DESC" }, take: 1 })
      rank = last ? last.rank + 1 : 0
    }

    const created = await service.createPaymentGateways({
      ...toModelData(gateway),
      rank,
      credentials: stored,
    })
    return new StepResponse(created, created.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: PaymentGatewayModuleService = container.resolve(PAYMENT_GATEWAY_MODULE)
    await service.deletePaymentGateways(id)
  }
)
