import { model } from "@medusajs/framework/utils"
import {
  BANNER_LINK_TYPES,
  BANNER_PLACEMENTS,
  BANNER_TEXT_ALIGNS,
  BANNER_TEXT_THEMES,
} from "../types"

// One image on a storefront's homepage. The whole image is a link (to a
// category, collection, product or URL), so every banner is a way into the
// catalog. `placement` decides the homepage section it appears in; `rank`
// orders banners within it.
const Banner = model
  .define("banner", {
    id: model.id({ prefix: "bnr" }).primaryKey(),
    storefront_key: model.text(),
    placement: model.enum([...BANNER_PLACEMENTS]),

    // Uploaded through the File Module; only the URLs are stored. The mobile
    // image is optional and replaces the desktop one on small screens.
    image_url: model.text(),
    mobile_image_url: model.text().nullable(),
    image_alt: model.text().nullable(),

    // Overlay copy. All optional: an image that carries its own text can go
    // without any.
    eyebrow: model.text().nullable(),
    title: model.text().nullable(),
    subtitle: model.text().nullable(),
    cta_label: model.text().nullable(),
    text_align: model.enum([...BANNER_TEXT_ALIGNS]).default("left"),
    text_theme: model.enum([...BANNER_TEXT_THEMES]).default("light"),

    // Category, collection and product links store the handle, so a banner
    // survives a reseed that changes ids.
    link_type: model.enum([...BANNER_LINK_TYPES]).default("category"),
    link_value: model.text(),

    is_active: model.boolean().default(true),
    starts_at: model.dateTime().nullable(),
    ends_at: model.dateTime().nullable(),
    rank: model.number().default(0),
  })
  .indexes([
    {
      on: ["storefront_key", "placement", "rank"],
      where: "deleted_at IS NULL",
    },
  ])

export default Banner
