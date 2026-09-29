import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { copyStorefrontBannersWorkflow } from "../../../../workflows/copy-storefront-banners"
import { CopyBannersBody } from "../validators"

// Copies all banners of one storefront to another (e.g. a new shop front).
export const POST = async (
  req: AuthenticatedMedusaRequest<CopyBannersBody>,
  res: MedusaResponse
) => {
  const { result } = await copyStorefrontBannersWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ banners: result, count: result.length })
}
