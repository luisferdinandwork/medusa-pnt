import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../../../../modules/content"
import ContentModuleService from "../../../../modules/content/service"
import { deleteProductStoryWorkflow } from "../../../../workflows/delete-product-story"
import { updateProductStoryWorkflow } from "../../../../workflows/update-product-story"
import { UpdateProductStoryBody } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const [product_story] = await service.listProductStories({
    id: req.params.id,
  })

  if (!product_story) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product story ${req.params.id} not found`
    )
  }

  res.json({ product_story })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateProductStoryBody>,
  res: MedusaResponse
) => {
  const { result } = await updateProductStoryWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json({ product_story: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteProductStoryWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "product_story", deleted: true })
}
