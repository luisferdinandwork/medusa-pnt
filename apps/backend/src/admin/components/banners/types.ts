// Mirrors the banner module (src/modules/banner). Section order and image
// ratios match the storefront homepage (apps/storefront/src/modules/home).

export type BannerPlacement = "hero" | "category" | "promo" | "feature"
export type BannerLinkType = "category" | "collection" | "product" | "url"
export type BannerTextAlign = "left" | "center" | "right"
export type BannerTextTheme = "light" | "dark"

export type Banner = {
  id: string
  storefront_key: string
  placement: BannerPlacement
  image_url: string
  mobile_image_url: string | null
  image_alt: string | null
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  cta_label: string | null
  text_align: BannerTextAlign
  text_theme: BannerTextTheme
  link_type: BannerLinkType
  link_value: string
  is_active: boolean
  starts_at: string | null
  ends_at: string | null
  rank: number
  updated_at: string
}

type PlacementInfo = {
  label: string
  /** "Add ..." button and editor title. */
  noun: string
  description: string
  /** Tailwind aspect class of the desktop image. */
  aspect: string
  size: string
  /** Placements shown full width get a separate phone image (4:5). */
  mobileSize: string | null
  /** Card grid on the banners page. */
  grid: string
}

export const PLACEMENT_ORDER: BannerPlacement[] = ["hero", "category", "promo", "feature"]

export const PLACEMENTS: Record<BannerPlacement, PlacementInfo> = {
  hero: {
    label: "Hero slider",
    noun: "slide",
    description:
      "Full-width slides at the top of the homepage, one after another. Put the newest drop or the biggest campaign first.",
    aspect: "aspect-[32/15]",
    size: "1920 x 900 px",
    mobileSize: "1080 x 1350 px",
    grid: "grid-cols-1 md:grid-cols-2",
  },
  category: {
    label: "Category tiles",
    noun: "tile",
    description:
      "Tall photo tiles right under the slider, one per category. The tile title is the category name shoppers tap.",
    aspect: "aspect-[4/5]",
    size: "800 x 1000 px",
    mobileSize: null,
    grid: "grid-cols-2 md:grid-cols-4",
  },
  promo: {
    label: "Promo pair",
    noun: "promo",
    description:
      "Two side-by-side images after the new arrivals, for single products or a small collection. Add them in pairs.",
    aspect: "aspect-[4/3]",
    size: "1200 x 900 px",
    mobileSize: null,
    grid: "grid-cols-1 md:grid-cols-2",
  },
  feature: {
    label: "Feature banner",
    noun: "feature banner",
    description:
      "A wide campaign image lower on the page. Usually one; several are stacked.",
    aspect: "aspect-[12/5]",
    size: "1920 x 800 px",
    mobileSize: "1080 x 1350 px",
    grid: "grid-cols-1",
  },
}

export const LINK_TYPE_LABEL: Record<BannerLinkType, string> = {
  category: "Category",
  collection: "Collection",
  product: "Product",
  url: "Page or URL",
}

export type BannerStatus = "live" | "scheduled" | "ended" | "hidden"

export const bannerStatus = (banner: Pick<Banner, "is_active" | "starts_at" | "ends_at">, now = new Date()): BannerStatus => {
  if (!banner.is_active) {
    return "hidden"
  }
  if (banner.starts_at && new Date(banner.starts_at) > now) {
    return "scheduled"
  }
  if (banner.ends_at && new Date(banner.ends_at) <= now) {
    return "ended"
  }
  return "live"
}

export const STATUS_LABEL: Record<BannerStatus, string> = {
  live: "Live",
  scheduled: "Scheduled",
  ended: "Ended",
  hidden: "Hidden",
}

export const STATUS_COLOR: Record<BannerStatus, "green" | "blue" | "orange" | "grey"> = {
  live: "green",
  scheduled: "blue",
  ended: "orange",
  hidden: "grey",
}

export const bannersQueryKey = (storefrontKey: string) => ["banners", storefrontKey]
