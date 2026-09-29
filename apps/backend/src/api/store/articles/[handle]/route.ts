import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { CONTENT_MODULE } from "../../../../modules/content"
import ContentModuleService from "../../../../modules/content/service"
import {
  resolveStorefrontKey,
  storefrontFilter,
} from "../../../utils/storefront-scope"

export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const storefrontKey = await resolveStorefrontKey(req)

  const [article] = await service.listArticles({
    handle: req.params.handle,
    status: "published",
    ...storefrontFilter(storefrontKey),
  })

  if (!article) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Article ${req.params.handle} not found`
    )
  }

  // Same category first, newest otherwise - keeps related guides linked together.
  const [related] = await service.listAndCountArticles(
    {
      status: "published",
      id: { $ne: article.id },
      ...storefrontFilter(storefrontKey),
      ...(article.category ? { category: article.category } : {}),
    },
    { take: 3, order: { published_at: "DESC" } }
  )

  res.json({ article, related })
}
