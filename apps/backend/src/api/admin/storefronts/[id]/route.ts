import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import { updateStorefrontWorkflow } from "../../../../workflows/update-storefront"
import { UpdateStorefrontBody } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "storefront",
    fields: ["*", "sales_channel.id", "sales_channel.name"],
    filters: { id: req.params.id },
  })

  if (!data.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Storefront ${req.params.id} not found`
    )
  }

  res.json({ storefront: data[0] })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateStorefrontBody>,
  res: MedusaResponse
) => {
  const { result } = await updateStorefrontWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json({ storefront: result })
}
