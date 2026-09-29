import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import ContentModuleService from "../../../modules/content/service"
import { createProductStoryWorkflow } from "../../../workflows/create-product-story"
import { parseListParams, searchFilter, toOrderConfig } from "../../utils/list-params"
import { CreateProductStoryBody } from "./validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const { q, status, storefront_key, limit, offset, order } = parseListParams(
    req,
    { order: "rank" }
  )

  const [product_stories, count] = await service.listAndCountProductStories(
    {
      ...searchFilter(q, ["title", "handle", "product_name", "excerpt"]),
      ...(status ? { status } : {}),
      ...(storefront_key ? { storefront_key } : {}),
    },
    { take: limit, skip: offset, order: toOrderConfig(order) }
  )

  res.json({ product_stories, count, limit, offset })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateProductStoryBody>,
  res: MedusaResponse
) => {
  const { result } = await createProductStoryWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ product_story: result })
}
