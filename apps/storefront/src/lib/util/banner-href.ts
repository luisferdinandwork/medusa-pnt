import type { Banner } from "@lib/data/banners"

/**
 * Where a banner leads. Shop links are paths without the country code (the
 * link component adds it); a "url" banner may also be an external address.
 */
export const bannerHref = ({
  link_type,
  link_value,
}: Pick<Banner, "link_type" | "link_value">) => {
  const value = link_value.trim()
  switch (link_type) {
    case "category":
      return `/categories/${value}`
    case "collection":
      return `/collections/${value}`
    case "product":
      return `/products/${value}`
    default:
      return value.startsWith("/") || /^https?:\/\//.test(value) ? value : `/${value}`
  }
}

export const isExternalHref = (href: string) => /^https?:\/\//.test(href)
