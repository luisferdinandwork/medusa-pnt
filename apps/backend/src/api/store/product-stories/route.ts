import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { CONTENT_MODULE } from "../../../modules/content"
import ContentModuleService from "../../../modules/content/service"
import {
  resolveStorefrontKey,
  storefrontFilter,
} from "../../utils/storefront-scope"

const toInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  return Number.isNaN(parsed) || parsed < 0 ? fallback : Math.min(parsed, max)
}

// Published product stories. ?product_handle returns the stories that list
// that product, which is how a product page finds its story.
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const storefrontKey = await resolveStorefrontKey(req)

  const productHandle =
    typeof req.query.product_handle === "string"
      ? req.query.product_handle.trim()
      : ""
  const categoryHandle =
    typeof req.query.category_handle === "string"
      ? req.query.category_handle.trim()
      : ""
  const limit = toInt(req.query.limit, 20, 100)
  const offset = toInt(req.query.offset, 0, 100000)

  const [stories, count] = await service.listAndCountProductStories(
    {
      status: "published",
      ...storefrontFilter(storefrontKey),
      ...(categoryHandle ? { category_handle: categoryHandle } : {}),
    },
    { take: limit, skip: offset, order: { rank: "ASC", created_at: "DESC" } }
  )

  // `product_handles` is a JSON column, so the match is applied after the query.
  const filtered = productHandle
    ? stories.filter((story) =>
        (story.product_handles ?? []).includes(productHandle)
      )
    : stories

  res.json({
    product_stories: filtered,
    count: productHandle ? filtered.length : count,
    limit,
    offset,
  })
}
