import { z } from "@medusajs/framework/zod"

const text = z.string().trim().max(500)
const optionalText = text.nullish()

const guideCard = z.object({
  eyebrow: z.string().trim().max(60),
  title: z.string().trim().max(120),
  description: z.string().trim().max(400),
})

const fields = {
  name: text.min(1),
  short_name: text.min(1).max(40),
  tagline: optionalText,
  default_title: optionalText,
  default_description: z.string().trim().max(1000).nullish(),
  announcement_items: z.array(text.min(1)).max(8).nullish(),
  hero_eyebrow: optionalText,
  hero_heading: optionalText,
  hero_body: z.string().trim().max(1000).nullish(),
  hero_price: optionalText,
  hero_compare_price: optionalText,
  hero_badge: optionalText,
  hero_cta_label: optionalText,
  editorial_eyebrow: optionalText,
  editorial_heading: optionalText,
  editorial_body: z.string().trim().max(1000).nullish(),
  editorial_cta_label: optionalText,
  editorial_image_url: z.string().trim().max(2000).nullish(),
  editorial_image_alt: optionalText,
  guide_cards: z.array(guideCard).max(4).nullish(),
}

export const CreateStorefrontSchema = z.object({
  key: z
    .string()
    .trim()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Gunakan huruf kecil, angka, dan tanda hubung"
    ),
  sales_channel_id: z.string().min(1),
  ...fields,
})

export const UpdateStorefrontSchema = z.object(fields).partial()

export type CreateStorefrontBody = z.infer<typeof CreateStorefrontSchema>
export type UpdateStorefrontBody = z.infer<typeof UpdateStorefrontSchema>
