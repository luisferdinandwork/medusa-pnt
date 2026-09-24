import { model } from "@medusajs/framework/utils"

// One row per storefront (a deployed shop front, e.g. "SPECS B2B"). The row is
// tied to a sales channel through a module link, so a storefront resolves its
// own copy from the publishable API key it already sends.
const Storefront = model.define("storefront", {
  id: model.id({ prefix: "sf" }).primaryKey(),
  key: model.text().unique(),
  name: model.text(),
  short_name: model.text(),
  tagline: model.text().nullable(),
  default_title: model.text().nullable(),
  default_description: model.text().nullable(),
  // string[]: one entry per announcement bar segment
  announcement_items: model.json().nullable(),
  hero_eyebrow: model.text().nullable(),
  hero_heading: model.text().nullable(),
  hero_body: model.text().nullable(),
  hero_price: model.text().nullable(),
  hero_compare_price: model.text().nullable(),
  hero_badge: model.text().nullable(),
  hero_cta_label: model.text().nullable(),
  // Homepage editorial story ("Cerita lapangan"). Empty heading hides the section.
  editorial_eyebrow: model.text().nullable(),
  editorial_heading: model.text().nullable(),
  editorial_body: model.text().nullable(),
  editorial_cta_label: model.text().nullable(),
  // Array<{ eyebrow: string; title: string; description: string }>, up to 4 cards.
  // Empty/missing hides the guide teaser section.
  guide_cards: model.json().nullable(),
})

export default Storefront
