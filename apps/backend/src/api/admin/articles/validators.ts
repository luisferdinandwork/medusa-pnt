import { z } from "@medusajs/framework/zod"

const text = z.string().trim().max(500)
const optionalText = text.nullish()
const longText = z.string().trim().max(20000).nullish()
const handle = z
  .string()
  .trim()
  .min(2)
  .max(120)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Gunakan huruf kecil, angka, dan tanda hubung")

const faq = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
})

const source = z.object({
  label: z.string().trim().min(1).max(200),
  url: z.string().trim().url().max(500),
})

const fields = {
  storefront_key: optionalText,
  title: text.min(1),
  subtitle: optionalText,
  excerpt: z.string().trim().max(2000).nullish(),
  content: longText,
  status: z.enum(["draft", "published"]),
  published_at: z.union([z.string().trim(), z.date()]).nullish(),
  rank: z.number().int().min(0).max(9999),
  is_featured: z.boolean(),
  category: optionalText,
  tags: z.array(text.min(1)).max(12).nullish(),
  cover_image_url: optionalText,
  cover_image_alt: optionalText,
  read_minutes: z.number().int().min(0).max(240).nullish(),
  author_name: optionalText,
  author_role: optionalText,
  seo_title: optionalText,
  seo_description: z.string().trim().max(1000).nullish(),
  seo_keywords: z.array(text.min(1)).max(20).nullish(),
  canonical_url: optionalText,
  og_image_url: optionalText,
  noindex: z.boolean(),
  answer_summary: z.string().trim().max(2000).nullish(),
  key_takeaways: z.array(z.string().trim().min(1).max(400)).max(10).nullish(),
  faqs: z.array(faq).max(20).nullish(),
  sources: z.array(source).max(20).nullish(),
  geo_locale: optionalText,
  geo_target_area: optionalText,
  related_product_handles: z.array(text.min(1)).max(24).nullish(),
  related_category_handles: z.array(text.min(1)).max(24).nullish(),
}

const optionalFields = z.object(fields).partial()

export const CreateArticleSchema = optionalFields.extend({
  handle,
  title: fields.title,
})

export const UpdateArticleSchema = optionalFields

export type CreateArticleBody = z.infer<typeof CreateArticleSchema>
export type UpdateArticleBody = z.infer<typeof UpdateArticleSchema>
