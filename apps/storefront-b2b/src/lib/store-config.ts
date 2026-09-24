import "server-only"
import { cache } from "react"

export type StoreConfig = {
  name: string
  shortName: string
  tagline: string
  defaultTitle: string
  defaultDescription: string
  /** One announcement bar segment per entry; an empty list hides the bar. */
  announcementItems: string[]
}

type RemoteStorefront = {
  name: string
  short_name: string
  tagline: string | null
  default_title: string | null
  default_description: string | null
  announcement_items: string[] | null
}

// Used only when the backend has no Storefront record for this publishable key
// (or is unreachable). Live values are edited in the Medusa admin, under
// "Storefronts".
const FALLBACK: StoreConfig = {
  name: "SPECS B2B",
  shortName: "SPECS B2B",
  tagline: "Portal Grosir untuk Mitra",
  defaultTitle: "SPECS B2B | Toko Grosir",
  defaultDescription:
    "Portal pemesanan grosir SPECS untuk reseller dan mitra bisnis.",
  announcementItems: [],
}

export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
  const backendUrl =
    process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000"
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY

  if (!publishableKey) {
    return FALLBACK
  }

  try {
    const response = await fetch(`${backendUrl}/store/storefront`, {
      headers: { "x-publishable-api-key": publishableKey },
      next: { revalidate: 60, tags: ["storefront-config"] },
    })
    if (!response.ok) {
      return FALLBACK
    }
    const { storefront } = (await response.json()) as {
      storefront: RemoteStorefront
    }
    return {
      name: storefront.name,
      shortName: storefront.short_name,
      tagline: storefront.tagline ?? "",
      defaultTitle: storefront.default_title || storefront.name,
      defaultDescription: storefront.default_description ?? "",
      announcementItems: storefront.announcement_items ?? [],
    }
  } catch {
    return FALLBACK
  }
})
