export type Faq = {
  question: string
  answer: string
}

export type Source = {
  label: string
  url: string
}

export type StorySection = {
  heading: string
  body: string
}

export type StoryHighlight = {
  label: string
  value: string
}

export type ContentStatus = "draft" | "published"

export const ARTICLE_FIELDS = [
  "handle",
  "storefront_key",
  "title",
  "subtitle",
  "excerpt",
  "content",
  "status",
  "published_at",
  "rank",
  "is_featured",
  "category",
  "tags",
  "cover_image_url",
  "cover_image_alt",
  "read_minutes",
  "author_name",
  "author_role",
  "seo_title",
  "seo_description",
  "seo_keywords",
  "canonical_url",
  "og_image_url",
  "noindex",
  "answer_summary",
  "key_takeaways",
  "faqs",
  "sources",
  "geo_locale",
  "geo_target_area",
  "related_product_handles",
  "related_category_handles",
] as const

export const PRODUCT_STORY_FIELDS = [
  "handle",
  "storefront_key",
  "title",
  "subtitle",
  "excerpt",
  "silo",
  "category_handle",
  "product_handles",
  "intro",
  "sections",
  "highlights",
  "faqs",
  "cover_image_url",
  "cover_image_alt",
  "cta_label",
  "cta_href",
  "status",
  "published_at",
  "rank",
  "seo_title",
  "seo_description",
  "seo_keywords",
] as const

export type ArticleData = {
  handle: string
  storefront_key?: string | null
  title: string
  subtitle?: string | null
  excerpt?: string | null
  content?: string | null
  status?: ContentStatus
  published_at?: Date | string | null
  rank?: number
  is_featured?: boolean
  category?: string | null
  tags?: string[] | null
  cover_image_url?: string | null
  cover_image_alt?: string | null
  read_minutes?: number | null
  author_name?: string | null
  author_role?: string | null
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
  canonical_url?: string | null
  og_image_url?: string | null
  noindex?: boolean
  answer_summary?: string | null
  key_takeaways?: string[] | null
  faqs?: Faq[] | null
  sources?: Source[] | null
  geo_locale?: string | null
  geo_target_area?: string | null
  related_product_handles?: string[] | null
  related_category_handles?: string[] | null
}

export type ProductStoryData = {
  handle: string
  storefront_key?: string | null
  title: string
  subtitle?: string | null
  excerpt?: string | null
  silo: string
  category_handle?: string | null
  product_handles?: string[] | null
  intro?: string | null
  sections?: StorySection[] | null
  highlights?: StoryHighlight[] | null
  faqs?: Faq[] | null
  cover_image_url?: string | null
  cover_image_alt?: string | null
  cta_label?: string | null
  cta_href?: string | null
  status?: ContentStatus
  published_at?: Date | string | null
  rank?: number
  seo_title?: string | null
  seo_description?: string | null
  seo_keywords?: string[] | null
}

// "published_at" is a date column: an ISO string coming off the wire has to be
// a Date before it reaches the service, and an empty string means "unset".
export const toDate = (value: Date | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  return value instanceof Date ? value : new Date(value)
}
