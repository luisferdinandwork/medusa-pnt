export const STOREFRONT_FIELDS = [
  "key",
  "name",
  "short_name",
  "tagline",
  "default_title",
  "default_description",
  "announcement_items",
  "hero_eyebrow",
  "hero_heading",
  "hero_body",
  "hero_price",
  "hero_compare_price",
  "hero_badge",
  "hero_cta_label",
  "editorial_eyebrow",
  "editorial_heading",
  "editorial_body",
  "editorial_cta_label",
  "guide_cards",
] as const

export type GuideCard = {
  eyebrow: string
  title: string
  description: string
}

export type StorefrontData = {
  key: string
  name: string
  short_name: string
  tagline?: string | null
  default_title?: string | null
  default_description?: string | null
  announcement_items?: string[] | null
  hero_eyebrow?: string | null
  hero_heading?: string | null
  hero_body?: string | null
  hero_price?: string | null
  hero_compare_price?: string | null
  hero_badge?: string | null
  hero_cta_label?: string | null
  editorial_eyebrow?: string | null
  editorial_heading?: string | null
  editorial_body?: string | null
  editorial_cta_label?: string | null
  guide_cards?: GuideCard[] | null
}

// The framework types JSON columns as an object; it stores the announcement
// string[]/guide_cards array as-is, so writes cast them to the expected shape.
export const toModelData = <T extends object>(data: T) =>
  data as unknown as Omit<T, "announcement_items" | "guide_cards"> & {
    announcement_items?: Record<string, unknown> | null
    guide_cards?: Record<string, unknown> | null
  }
