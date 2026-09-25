import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../../../../modules/content"
import ContentModuleService from "../../../../modules/content/service"
import { deleteArticleWorkflow } from "../../../../workflows/delete-article"
import { updateArticleWorkflow } from "../../../../workflows/update-article"
import { UpdateArticleBody } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const [article] = await service.listArticles({ id: req.params.id })

  if (!article) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Article ${req.params.id} not found`
    )
  }

  res.json({ article })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateArticleBody>,
  res: MedusaResponse
) => {
  const { result } = await updateArticleWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json({ article: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteArticleWorkflow(req.scope).run({ input: { id: req.params.id } })

  res.json({ id: req.params.id, object: "article", deleted: true })
}
