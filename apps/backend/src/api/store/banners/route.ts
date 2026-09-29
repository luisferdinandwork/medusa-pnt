import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import { BANNER_MODULE } from "../../../modules/banner"
import BannerModuleService from "../../../modules/banner/service"
import { BANNER_PLACEMENTS } from "../../../modules/banner/types"
import { resolveStorefrontKey } from "../../utils/storefront-scope"

const PUBLIC_FIELDS = [
  "id",
  "placement",
  "image_url",
  "mobile_image_url",
  "image_alt",
  "eyebrow",
  "title",
  "subtitle",
  "cta_label",
  "text_align",
  "text_theme",
  "link_type",
  "link_value",
  "rank",
]

// The homepage banners of the storefront that owns the publishable API key:
// active, inside their schedule, in homepage order. ?placement=hero narrows it
// to one section.
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const storefrontKey = await resolveStorefrontKey(req)
  if (!storefrontKey) {
    res.json({ banners: [] })
    return
  }

  const service: BannerModuleService = req.scope.resolve(BANNER_MODULE)
  const placement =
    typeof req.query.placement === "string" &&
    (BANNER_PLACEMENTS as readonly string[]).includes(req.query.placement)
      ? req.query.placement
      : undefined
  const now = new Date()

  const banners = await service.listBanners(
    {
      storefront_key: storefrontKey,
      is_active: true,
      ...(placement ? { placement: placement as (typeof BANNER_PLACEMENTS)[number] } : {}),
      $and: [
        { $or: [{ starts_at: null }, { starts_at: { $lte: now } }] },
        { $or: [{ ends_at: null }, { ends_at: { $gt: now } }] },
      ],
    },
    {
      select: PUBLIC_FIELDS,
      order: { placement: "ASC", rank: "ASC", created_at: "ASC" },
      take: 200,
    }
  )

  res.json({ banners })
}
