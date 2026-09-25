import { model } from "@medusajs/framework/utils"
import type { Faq, StoryHighlight, StorySection } from "../types"

// A product story is a short article that describes one product silo (a family
// of products sold together, e.g. "Sepatu Bola FG"). It gives the silo a hub
// page to link from and gives every product in it a piece of editorial copy.
const ProductStory = model.define("product_story", {
  id: model.id({ prefix: "pstory" }).primaryKey(),
  handle: model.text().unique(),
  storefront_key: model.text().nullable(),

  title: model.text(),
  subtitle: model.text().nullable(),
  excerpt: model.text().nullable(),

  // The silo this story owns: a label, and the category it maps to in the shop.
  silo: model.text(),
  category_handle: model.text().nullable(),
  // Handles of the products that belong to the silo. Product pages look
  // themselves up here to decide which story to show.
  product_handles: model.json<string[]>().nullable(),

  intro: model.text().nullable(),
  // Body of the story, rendered in order. Markdown allowed in `body`.
  sections: model.json<StorySection[]>().nullable(),
  // Spec table rendered next to the story, e.g. { label: "Sol", value: "FG" }.
  highlights: model.json<StoryHighlight[]>().nullable(),
  faqs: model.json<Faq[]>().nullable(),

  cover_image_url: model.text().nullable(),
  cover_image_alt: model.text().nullable(),
  cta_label: model.text().nullable(),
  cta_href: model.text().nullable(),

  status: model.enum(["draft", "published"]).default("draft"),
  published_at: model.dateTime().nullable(),
  rank: model.number().default(0),

  seo_title: model.text().nullable(),
  seo_description: model.text().nullable(),
  seo_keywords: model.json<string[]>().nullable(),
})

export default ProductStory
