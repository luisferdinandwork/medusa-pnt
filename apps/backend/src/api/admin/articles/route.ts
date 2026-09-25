import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import ContentModuleService from "../../../modules/content/service"
import { createArticleWorkflow } from "../../../workflows/create-article"
import { parseListParams, searchFilter, toOrderConfig } from "../../utils/list-params"
import { CreateArticleBody } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const { q, status, storefront_key, limit, offset, order } =
    parseListParams(req)

  const [articles, count] = await service.listAndCountArticles(
    {
      ...searchFilter(q, ["title", "handle", "excerpt", "category"]),
      ...(status ? { status } : {}),
      ...(storefront_key ? { storefront_key } : {}),
    },
    { take: limit, skip: offset, order: toOrderConfig(order) }
  )

  res.json({ articles, count, limit, offset })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateArticleBody>,
  res: MedusaResponse
) => {
  const { result } = await createArticleWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ article: result })
}
