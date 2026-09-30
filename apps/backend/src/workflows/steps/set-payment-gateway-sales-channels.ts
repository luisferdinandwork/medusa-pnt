import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import paymentGatewaySalesChannelLink from "../../links/payment-gateway-sales-channel"
import { PAYMENT_GATEWAY_MODULE } from "../../modules/payment-gateway"

export type SetPaymentGatewaySalesChannelsStepInput = {
  gateway_id: string
  // Undefined leaves the channels as they are.
  sales_channel_ids?: string[]
}

const toLinks = (gatewayId: string, salesChannelIds: string[]) =>
  salesChannelIds.map((salesChannelId) => ({
    [PAYMENT_GATEWAY_MODULE]: { payment_gateway_id: gatewayId },
    [Modules.SALES_CHANNEL]: { sales_channel_id: salesChannelId },
  }))

/** Makes the gateway's sales channels exactly the given list. */
export const setPaymentGatewaySalesChannelsStep = createStep(
  "set-payment-gateway-sales-channels",
  async (input: SetPaymentGatewaySalesChannelsStepInput, { container }) => {
    if (!input.sales_channel_ids) {
      return new StepResponse(void 0)
    }
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    const wanted = [...new Set(input.sales_channel_ids)]

    if (wanted.length) {
      const { data: channels } = await query.graph({
        entity: "sales_channel",
        fields: ["id"],
        filters: { id: wanted },
      })
      if (channels.length !== wanted.length) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          "One of the chosen sales channels does not exist."
        )
      }
    }

    const { data: existing } = await query.graph({
      entity: paymentGatewaySalesChannelLink.entryPoint,
      fields: ["sales_channel_id"],
      filters: { payment_gateway_id: input.gateway_id },
    })
    const current = existing.map((row) => row.sales_channel_id as string)
    const added = wanted.filter((id) => !current.includes(id))
    const removed = current.filter((id) => !wanted.includes(id))

    if (removed.length) {
      await link.dismiss(toLinks(input.gateway_id, removed))
    }
    if (added.length) {
      await link.create(toLinks(input.gateway_id, added))
    }
    return new StepResponse(void 0, { gatewayId: input.gateway_id, added, removed })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    if (compensation.added.length) {
      await link.dismiss(toLinks(compensation.gatewayId, compensation.added))
    }
    if (compensation.removed.length) {
      await link.create(toLinks(compensation.gatewayId, compensation.removed))
    }
  }
)
