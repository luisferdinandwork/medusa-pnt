export const BANNER_PLACEMENTS = ["hero", "category", "promo", "feature"] as const
export const BANNER_LINK_TYPES = ["category", "collection", "product", "url"] as const
export const BANNER_TEXT_ALIGNS = ["left", "center", "right"] as const
export const BANNER_TEXT_THEMES = ["light", "dark"] as const

export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number]
export type BannerLinkType = (typeof BANNER_LINK_TYPES)[number]
export type BannerTextAlign = (typeof BANNER_TEXT_ALIGNS)[number]
export type BannerTextTheme = (typeof BANNER_TEXT_THEMES)[number]

export const BANNER_FIELDS = [
  "storefront_key",
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
  "is_active",
  "starts_at",
  "ends_at",
  "rank",
] as const

export type BannerData = {
  storefront_key: string
  placement: BannerPlacement
  image_url: string
  mobile_image_url?: string | null
  image_alt?: string | null
  eyebrow?: string | null
  title?: string | null
  subtitle?: string | null
  cta_label?: string | null
  text_align?: BannerTextAlign
  text_theme?: BannerTextTheme
  link_type?: BannerLinkType
  link_value: string
  is_active?: boolean
  starts_at?: Date | string | null
  ends_at?: Date | string | null
  rank?: number
}

// Date columns: an ISO string off the wire becomes a Date, "" means unset.
export const toDate = (value: Date | string | null | undefined) => {
  if (value === null || value === undefined || value === "") {
    return null
  }
  return value instanceof Date ? value : new Date(value)
}

/** True when both ends are set and the banner would stop before it starts. */
export const isInvertedSchedule = (
  startsAt: Date | string | null | undefined,
  endsAt: Date | string | null | undefined
) => {
  const starts = toDate(startsAt)
  const ends = toDate(endsAt)
  return !!starts && !!ends && ends <= starts
}

/** Converts the schedule fields that are present, leaves the rest alone. */
export const withDates = <T extends Partial<BannerData>>(data: T) => {
  const { starts_at, ends_at, ...rest } = data
  return {
    ...rest,
    ...(starts_at === undefined ? {} : { starts_at: toDate(starts_at) }),
    ...(ends_at === undefined ? {} : { ends_at: toDate(ends_at) }),
  }
}
