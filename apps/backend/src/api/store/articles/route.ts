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

// Published articles for the storefront behind this publishable key. Supports
// ?category, ?tag, ?featured, ?limit and ?offset.
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const service: ContentModuleService = req.scope.resolve(CONTENT_MODULE)
  const storefrontKey = await resolveStorefrontKey(req)

  const category =
    typeof req.query.category === "string" ? req.query.category.trim() : ""
  const tag = typeof req.query.tag === "string" ? req.query.tag.trim() : ""
  const limit = toInt(req.query.limit, 20, 100)
  const offset = toInt(req.query.offset, 0, 100000)

  const [articles, count] = await service.listAndCountArticles(
    {
      status: "published",
      ...storefrontFilter(storefrontKey),
      ...(category ? { category } : {}),
      ...(req.query.featured === "true" ? { is_featured: true } : {}),
    },
    {
      take: limit,
      skip: offset,
      order: { published_at: "DESC", created_at: "DESC" },
    }
  )

  // `tags` is a JSON column, so the tag filter is applied after the query.
  const filtered = tag
    ? articles.filter((article) => (article.tags ?? []).includes(tag))
    : articles

  res.json({
    articles: filtered,
    count: tag ? filtered.length : count,
    limit,
    offset,
  })
}
