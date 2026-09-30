import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { GatewayRecord } from "../../../lib/payment-gateways"
import { toCredentialsPatch } from "../../../lib/payment-gateways/credentials"
import { createPaymentGatewayWorkflow } from "../../../workflows/create-payment-gateway"
import { GATEWAY_QUERY_FIELDS, serializeGateway } from "../../utils/payment-gateways"
import { CreatePaymentGatewayBody } from "./validators"

// Every payment gateway, in checkout order, with the sales channels it serves.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "payment_gateway",
    fields: GATEWAY_QUERY_FIELDS,
  })

  const gateways = (data as GatewayRecord[])
    .sort((a, b) => a.rank - b.rank || a.created_at.valueOf() - b.created_at.valueOf())
    .map(serializeGateway)

  res.json({ payment_gateways: gateways, count: gateways.length })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreatePaymentGatewayBody>,
  res: MedusaResponse
) => {
  const { credentials, sales_channel_ids, ...gateway } = req.validatedBody

  const { result } = await createPaymentGatewayWorkflow(req.scope).run({
    input: {
      gateway,
      credentials: toCredentialsPatch(gateway.provider, credentials),
      sales_channel_ids,
    },
  })

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "payment_gateway",
    fields: GATEWAY_QUERY_FIELDS,
    filters: { id: result.id },
  })

  res.status(201).json({ payment_gateway: serializeGateway(data[0] as GatewayRecord) })
}
