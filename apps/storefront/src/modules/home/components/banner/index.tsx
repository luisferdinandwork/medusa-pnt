import type { ReactNode } from "react"
import type { Banner } from "@lib/data/banners"
import { bannerHref, isExternalHref } from "@lib/util/banner-href"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The whole banner is one link, so the image itself is the button into the
 * catalog. External URLs open as plain links.
 */
export const BannerLink = ({
  banner,
  className,
  children,
}: {
  banner: Pick<Banner, "link_type" | "link_value" | "title" | "image_alt" | "cta_label">
  className?: string
  children: ReactNode
}) => {
  const href = bannerHref(banner)
  const label = banner.title || banner.image_alt || banner.cta_label || undefined

  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} aria-label={label}>
        {children}
      </a>
    )
  }
  return (
    <LocalizedClientLink href={href} className={className} aria-label={label}>
      {children}
    </LocalizedClientLink>
  )
}

/**
 * The banner image filling its box. With a phone image, screens under 768 px
 * get that one instead (art direction, not just a smaller copy).
 */
export const BannerPicture = ({
  banner,
  priority = false,
  className,
}: {
  banner: Pick<Banner, "image_url" | "mobile_image_url" | "image_alt">
  priority?: boolean
  className?: string
}) => (
  <picture>
    {banner.mobile_image_url && (
      <source media="(max-width: 767px)" srcSet={banner.mobile_image_url} />
    )}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img
      src={banner.image_url}
      alt={banner.image_alt ?? ""}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={clx("absolute inset-0 h-full w-full object-cover", className)}
    />
  </picture>
)

/** Bottom gradient that keeps overlay text readable on any photo. */
export const BannerShade = ({ theme }: { theme: Banner["text_theme"] }) => (
  <div
    aria-hidden
    className={clx(
      "pointer-events-none absolute inset-0",
      theme === "light"
        ? "bg-gradient-to-t from-black/65 via-black/15 to-transparent"
        : "bg-gradient-to-t from-white/70 via-white/10 to-transparent"
    )}
  />
)

const ALIGN = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

/**
 * Eyebrow, title, subtitle and a button-looking label. It sits inside the
 * banner link, so the "button" is a span: one link, one tab stop.
 */
export const BannerCopy = ({
  banner,
  size = "large",
  className,
}: {
  banner: Pick<
    Banner,
    "eyebrow" | "title" | "subtitle" | "cta_label" | "text_align" | "text_theme"
  >
  size?: "large" | "medium"
  className?: string
}) => {
  const light = banner.text_theme === "light"
  if (!banner.eyebrow && !banner.title && !banner.subtitle && !banner.cta_label) {
    return null
  }

  return (
    <div
      className={clx(
        "flex flex-col gap-y-3",
        ALIGN[banner.text_align],
        light ? "text-white" : "text-ink",
        className
      )}
    >
      {banner.eyebrow && (
        <span className="flex items-center gap-x-2 text-[11px] font-semibold uppercase tracking-[0.2em]">
          <span className={clx("h-[2px] w-6", light ? "bg-white" : "bg-red-500")} />
          {banner.eyebrow}
        </span>
      )}
      {banner.title && (
        <span
          className={clx(
            "font-display uppercase leading-[0.92] tracking-tight [text-wrap:balance]",
            size === "large"
              ? "text-4xl xsmall:text-5xl small:text-6xl medium:text-7xl max-w-3xl"
              : "text-3xl small:text-4xl max-w-md"
          )}
        >
          {banner.title}
        </span>
      )}
      {banner.subtitle && (
        <span
          className={clx(
            "max-w-md",
            size === "large" ? "text-sm small:text-base" : "text-sm",
            light ? "text-white/85" : "text-ink-500"
          )}
        >
          {banner.subtitle}
        </span>
      )}
      {banner.cta_label && (
        <span
          className={clx(
            "mt-1 inline-flex h-11 items-center gap-x-2 rounded-full px-6 text-xs font-semibold uppercase tracking-wide transition-colors",
            light
              ? "bg-white text-ink group-hover:bg-red-500 group-hover:text-white"
              : "bg-ink text-white group-hover:bg-red-500"
          )}
        >
          {banner.cta_label}
          <span aria-hidden>&rarr;</span>
        </span>
      )}
    </div>
  )
}
