import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createStorefrontWorkflow } from "../../../workflows/create-storefront"
import { CreateStorefrontBody } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: storefronts } = await query.graph({
    entity: "storefront",
    fields: ["*", "sales_channel.id", "sales_channel.name"],
  })

  res.json({ storefronts, count: storefronts.length })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateStorefrontBody>,
  res: MedusaResponse
) => {
  const { sales_channel_id, ...storefront } = req.validatedBody

  const { result } = await createStorefrontWorkflow(req.scope).run({
    input: { storefront, sales_channel_id },
  })

  res.status(201).json({ storefront: result })
}
