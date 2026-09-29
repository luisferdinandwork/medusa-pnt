import { z } from "@medusajs/framework/zod"
import {
  BANNER_LINK_TYPES,
  BANNER_PLACEMENTS,
  BANNER_TEXT_ALIGNS,
  BANNER_TEXT_THEMES,
} from "../../../modules/banner/types"

const storefrontKey = z.string().trim().min(1).max(60)
const url = z.string().trim().min(1).max(2000)
const copy = (max: number) => z.string().trim().max(max).nullish()
const date = z.union([z.string().trim(), z.date()]).nullish()

const fields = {
  storefront_key: storefrontKey,
  placement: z.enum(BANNER_PLACEMENTS),
  image_url: url,
  mobile_image_url: url.nullish(),
  image_alt: copy(300),
  eyebrow: copy(80),
  title: copy(160),
  subtitle: copy(300),
  cta_label: copy(40),
  text_align: z.enum(BANNER_TEXT_ALIGNS),
  text_theme: z.enum(BANNER_TEXT_THEMES),
  link_type: z.enum(BANNER_LINK_TYPES),
  link_value: z.string().trim().min(1).max(2000),
  is_active: z.boolean(),
  starts_at: date,
  ends_at: date,
  rank: z.number().int().min(0).max(9999),
}

const optionalFields = z.object(fields).partial()

export const CreateBannerSchema = optionalFields.extend({
  storefront_key: fields.storefront_key,
  placement: fields.placement,
  image_url: fields.image_url,
  link_value: fields.link_value,
})

export const UpdateBannerSchema = optionalFields

export const ReorderBannersSchema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
})

export const CopyBannersSchema = z.object({
  from_storefront_key: storefrontKey,
  to_storefront_key: storefrontKey,
  replace: z.boolean().optional(),
})

export type CreateBannerBody = z.infer<typeof CreateBannerSchema>
export type UpdateBannerBody = z.infer<typeof UpdateBannerSchema>
export type ReorderBannersBody = z.infer<typeof ReorderBannersSchema>
export type CopyBannersBody = z.infer<typeof CopyBannersSchema>
