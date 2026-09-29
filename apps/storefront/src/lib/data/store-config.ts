import "server-only"

import { cache } from "react"
import { fallbackStoreConfig, GuideCard, StoreConfig } from "@lib/store-config"

type RemoteStorefront = {
  key: string
  name: string
  short_name: string
  tagline: string | null
  default_title: string | null
  default_description: string | null
  announcement_items: string[] | null
  hero_eyebrow: string | null
  hero_heading: string | null
  hero_body: string | null
  hero_price: string | null
  hero_compare_price: string | null
  hero_badge: string | null
  hero_cta_label: string | null
  editorial_eyebrow: string | null
  editorial_heading: string | null
  editorial_body: string | null
  editorial_cta_label: string | null
  editorial_image_url: string | null
  editorial_image_alt: string | null
  guide_cards: GuideCard[] | null
}

function fromRemote(remote: RemoteStorefront): StoreConfig {
  return {
    key: remote.key,
    name: remote.name,
    shortName: remote.short_name,
    tagline: remote.tagline ?? "",
    defaultTitle: remote.default_title || remote.name,
    defaultDescription: remote.default_description ?? "",
    announcementItems: remote.announcement_items ?? [],
    hero: {
      eyebrow: remote.hero_eyebrow ?? "",
      heading: remote.hero_heading ?? "",
      body: remote.hero_body ?? "",
      price: remote.hero_price ?? "",
      comparePrice: remote.hero_compare_price ?? "",
      badge: remote.hero_badge ?? "",
      ctaLabel: remote.hero_cta_label ?? "",
    },
    editorial: {
      eyebrow: remote.editorial_eyebrow ?? "",
      heading: remote.editorial_heading ?? "",
      body: remote.editorial_body ?? "",
      ctaLabel: remote.editorial_cta_label ?? "",
      imageUrl: remote.editorial_image_url ?? "",
      imageAlt: remote.editorial_image_alt ?? "",
    },
    guideCards: remote.guide_cards ?? [],
  }
}

/**
 * Branding and copy for this storefront, managed in the Medusa admin
 * (Storefronts). Resolved by the publishable API key, cached for a minute, and
 * falls back to the static preset if the backend has no record or is down.
 */
export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    return fallbackStoreConfig
  }

  try {
    const response = await fetch(`${backendUrl}/store/storefront`, {
      headers: { "x-publishable-api-key": publishableKey },
      next: { revalidate: 60, tags: ["storefront-config"] },
    })
    if (!response.ok) {
      return fallbackStoreConfig
    }
    const { storefront } = (await response.json()) as {
      storefront: RemoteStorefront
    }
    return fromRemote(storefront)
  } catch {
    return fallbackStoreConfig
  }
})
