export type Faq = { question: string; answer: string }
export type Source = { label: string; url: string }
export type StorySection = { heading: string; body: string }
export type StoryHighlight = { label: string; value: string }

export type Article = {
  id: string
  handle: string
  storefront_key: string | null
  title: string
  subtitle: string | null
  excerpt: string | null
  content: string | null
  status: "draft" | "published"
  published_at: string | null
  rank: number
  is_featured: boolean
  category: string | null
  tags: string[] | null
  cover_image_url: string | null
  cover_image_alt: string | null
  read_minutes: number | null
  author_name: string | null
  author_role: string | null
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  canonical_url: string | null
  og_image_url: string | null
  noindex: boolean
  answer_summary: string | null
  key_takeaways: string[] | null
  faqs: Faq[] | null
  sources: Source[] | null
  geo_locale: string | null
  geo_target_area: string | null
  related_product_handles: string[] | null
  related_category_handles: string[] | null
  updated_at: string
}

export type ProductStory = {
  id: string
  handle: string
  storefront_key: string | null
  title: string
  subtitle: string | null
  excerpt: string | null
  silo: string
  category_handle: string | null
  product_handles: string[] | null
  intro: string | null
  sections: StorySection[] | null
  highlights: StoryHighlight[] | null
  faqs: Faq[] | null
  cover_image_url: string | null
  cover_image_alt: string | null
  cta_label: string | null
  cta_href: string | null
  status: "draft" | "published"
  published_at: string | null
  rank: number
  seo_title: string | null
  seo_description: string | null
  seo_keywords: string[] | null
  updated_at: string
}

export type StorefrontOption = { id: string; key: string; name: string }

/** Radix Select cannot hold an empty value, so "all storefronts" gets a token. */
export const ALL_STOREFRONTS = "__all__"
