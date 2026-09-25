import { z } from "@medusajs/framework/zod"

const text = z.string().trim().max(500)
const optionalText = text.nullish()
const handle = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung")

const section = z.object({
  heading: z.string().trim().min(1).max(200),
  body: z.string().trim().min(1).max(4000),
})

const highlight = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(200),
})

const faq = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
})

const fields = {
  storefront_key: optionalText,
  title: text.min(1),
  subtitle: optionalText,
  excerpt: z.string().trim().max(2000).nullish(),
  silo: text.min(1),
  category_handle: optionalText,
  product_handles: z.array(text.min(1)).max(40).nullish(),
  intro: z.string().trim().max(4000).nullish(),
  sections: z.array(section).max(12).nullish(),
  highlights: z.array(highlight).max(12).nullish(),
  faqs: z.array(faq).max(20).nullish(),
  cover_image_url: optionalText,
  cover_image_alt: optionalText,
  cta_label: optionalText,
  cta_href: optionalText,
  status: z.enum(["draft", "published"]),
  published_at: z.union([z.string().trim(), z.date()]).nullish(),
  rank: z.number().int().min(0).max(9999),
  seo_title: optionalText,
  seo_description: z.string().trim().max(1000).nullish(),
  seo_keywords: z.array(text.min(1)).max(20).nullish(),
}

const optionalFields = z.object(fields).partial()

export const CreateProductStorySchema = optionalFields.extend({
  handle,
  title: fields.title,
  silo: fields.silo,
})

export const UpdateProductStorySchema = optionalFields

export type CreateProductStoryBody = z.infer<typeof CreateProductStorySchema>
export type UpdateProductStoryBody = z.infer<typeof UpdateProductStorySchema>
