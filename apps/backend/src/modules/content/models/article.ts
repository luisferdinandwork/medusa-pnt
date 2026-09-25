import { model } from "@medusajs/framework/utils"
import type { Faq, Source } from "../types"

// One row per editorial article (the storefront blog). Articles carry the SEO
// fields a crawler reads and the GEO fields an answer engine quotes, so the
// storefront can render both the page and its JSON-LD from a single record.
const Article = model.define("article", {
  id: model.id({ prefix: "art" }).primaryKey(),
  handle: model.text().unique(),
  // Which storefront shows the article. null = every storefront.
  storefront_key: model.text().nullable(),

  title: model.text(),
  subtitle: model.text().nullable(),
  excerpt: model.text().nullable(),
  // Markdown: ##/### headings, lists, quotes, links, **bold**.
  content: model.text().nullable(),

  status: model.enum(["draft", "published"]).default("draft"),
  published_at: model.dateTime().nullable(),
  // Lower ranks come first inside a listing.
  rank: model.number().default(0),
  is_featured: model.boolean().default(false),

  category: model.text().nullable(),
  tags: model.json<string[]>().nullable(),
  cover_image_url: model.text().nullable(),
  cover_image_alt: model.text().nullable(),
  read_minutes: model.number().nullable(),

  author_name: model.text().nullable(),
  author_role: model.text().nullable(),

  // SEO
  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_keywords: model.json<string[]>().nullable(),
  canonical_url: model.text().nullable(),
  og_image_url: model.text().nullable(),
  noindex: model.boolean().default(false),

  // GEO (generative engine optimization): the answer-first block, the bullets
  // and the Q&A pairs an AI assistant lifts, plus the citations it credits.
  answer_summary: model.text().nullable(),
  key_takeaways: model.json<string[]>().nullable(),
  faqs: model.json<Faq[]>().nullable(),
  sources: model.json<Source[]>().nullable(),
  // Language and service area written into the JSON-LD (local/geo targeting).
  geo_locale: model.text().nullable(),
  geo_target_area: model.text().nullable(),

  // Silo interlinking: the products and categories this article points at.
  related_product_handles: model.json<string[]>().nullable(),
  related_category_handles: model.json<string[]>().nullable(),
})

export default Article
