"use server"

import { sdk } from "@lib/config"
import { getCacheOptions } from "./cookies"

export type BannerPlacement = "hero" | "category" | "promo" | "feature"

export type Banner = {
  id: string
  placement: BannerPlacement
  image_url: string
  mobile_image_url: string | null
  image_alt: string | null
  eyebrow: string | null
  title: string | null
  subtitle: string | null
  cta_label: string | null
  text_align: "left" | "center" | "right"
  text_theme: "light" | "dark"
  link_type: "category" | "collection" | "product" | "url"
  link_value: string
  rank: number
}

export type HomepageBanners = Record<BannerPlacement, Banner[]>

/**
 * This storefront's live homepage banners, grouped by section. Managed in the
 * Medusa admin under Storefronts > Banners; the backend resolves the storefront
 * from the publishable key and drops hidden or out-of-schedule banners. Cached
 * for a minute like the rest of the editorial content.
 */
export const listHomepageBanners = async (): Promise<HomepageBanners> => {
  const grouped: HomepageBanners = { hero: [], category: [], promo: [], feature: [] }
  const next = { ...(await getCacheOptions("banners")), revalidate: 60 }

  try {
    const { banners } = await sdk.client.fetch<{ banners: Banner[] }>(
      "/store/banners",
      { next }
    )
    for (const banner of banners) {
      grouped[banner.placement]?.push(banner)
    }
  } catch {
    // No banners: every section falls back or hides itself.
  }

  return grouped
}
