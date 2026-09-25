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

  const [product_story] = await service.listProductStories({
    handle: req.params.handle,
    status: "published",
    ...storefrontFilter(storefrontKey),
  })

  if (!product_story) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product story ${req.params.handle} not found`
    )
  }

  const [related] = await service.listAndCountProductStories(
    {
      status: "published",
      id: { $ne: product_story.id },
      ...storefrontFilter(storefrontKey),
    },
    { take: 3, order: { rank: "ASC" } }
  )

  res.json({ product_story, related })
}
