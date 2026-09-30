import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { listChannelGateways, toStoreGateway } from "../../utils/payment-gateways"

// The payment gateways the publishable key's sales channel offers at checkout,
// in order. Open a session with `provider_id` and `data.gateway_id` from here.
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const gateways = await listChannelGateways(
    query,
    req.publishable_key_context?.sales_channel_ids ?? []
  )

  res.json({ payment_gateways: gateways.map(toStoreGateway) })
}
