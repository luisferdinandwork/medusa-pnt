import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { reorderBannersWorkflow } from "../../../../workflows/reorder-banners"
import { ReorderBannersBody } from "../validators"

// Body: { ids } in the new order of one homepage section.
export const POST = async (
  req: AuthenticatedMedusaRequest<ReorderBannersBody>,
  res: MedusaResponse
) => {
  await reorderBannersWorkflow(req.scope).run({
    input: { ids: req.validatedBody.ids },
  })

  res.json({ ids: req.validatedBody.ids, object: "banner", reordered: true })
}
