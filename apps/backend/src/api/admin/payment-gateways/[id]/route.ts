import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import type { GatewayRecord } from "../../../../lib/payment-gateways"
import { toCredentialsPatch } from "../../../../lib/payment-gateways/credentials"
import { PAYMENT_GATEWAY_MODULE } from "../../../../modules/payment-gateway"
import PaymentGatewayModuleService from "../../../../modules/payment-gateway/service"
import { deletePaymentGatewayWorkflow } from "../../../../workflows/delete-payment-gateway"
import { updatePaymentGatewayWorkflow } from "../../../../workflows/update-payment-gateway"
import { GATEWAY_QUERY_FIELDS, serializeGateway } from "../../../utils/payment-gateways"
import { UpdatePaymentGatewayBody } from "../validators"

const TRANSACTION_FIELDS = [
  "id",
  "reference",
  "session_id",
  "cart_id",
  "amount",
  "currency_code",
  "status",
  "gateway_status",
  "payment_method",
  "expires_at",
  "paid_at",
  "created_at",
  "updated_at",
]

const loadGateway = async (req: AuthenticatedMedusaRequest, id: string) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "payment_gateway",
    fields: GATEWAY_QUERY_FIELDS,
    filters: { id },
  })
  const gateway = data[0] as GatewayRecord | undefined
  if (!gateway) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, `Payment gateway ${id} not found`)
  }
  return gateway
}

// The gateway and its 25 latest charges.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const gateway = await loadGateway(req, req.params.id)
  const service: PaymentGatewayModuleService = req.scope.resolve(PAYMENT_GATEWAY_MODULE)
  const transactions = await service.listPaymentGatewayTransactions(
    { gateway_id: gateway.id },
    { select: TRANSACTION_FIELDS, order: { created_at: "DESC" }, take: 25 }
  )

  res.json({ payment_gateway: serializeGateway(gateway), transactions })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdatePaymentGatewayBody>,
  res: MedusaResponse
) => {
  const previous = await loadGateway(req, req.params.id)
  const { credentials, sales_channel_ids, ...data } = req.validatedBody

  await updatePaymentGatewayWorkflow(req.scope).run({
    input: {
      id: previous.id,
      data,
      credentials: toCredentialsPatch(previous.provider, credentials),
      sales_channel_ids,
    },
  })

  res.json({ payment_gateway: serializeGateway(await loadGateway(req, previous.id)) })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deletePaymentGatewayWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "payment_gateway", deleted: true })
}
