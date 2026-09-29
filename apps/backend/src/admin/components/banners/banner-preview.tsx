import { Photo } from "@medusajs/icons"
import { clx, Text } from "@medusajs/ui"
import { type Banner, PLACEMENTS } from "./types"

type PreviewBanner = Pick<
  Banner,
  | "placement"
  | "image_url"
  | "mobile_image_url"
  | "image_alt"
  | "eyebrow"
  | "title"
  | "subtitle"
  | "cta_label"
  | "text_align"
  | "text_theme"
>

const ALIGN = {
  left: "items-start text-left",
  center: "items-center text-center",
  right: "items-end text-right",
}

/**
 * The banner as the storefront draws it: image, a legibility gradient and the
 * overlay copy at the bottom. `mobile` shows the phone crop.
 */
export const BannerPreview = ({
  banner,
  mobile = false,
  compact = false,
  className,
}: {
  banner: PreviewBanner
  mobile?: boolean
  /** Small thumbnail (cards on the banners page): smaller type, no subtitle. */
  compact?: boolean
  className?: string
}) => {
  const info = PLACEMENTS[banner.placement]
  const src = mobile ? banner.mobile_image_url || banner.image_url : banner.image_url
  const aspect = mobile && info.mobileSize ? "aspect-[4/5]" : info.aspect
  const light = banner.text_theme === "light"
  const isTile = banner.placement === "category"
  const hasCopy = !!(banner.eyebrow || banner.title || banner.subtitle || banner.cta_label)
  const large = !isTile && banner.placement !== "promo" && !mobile && !compact

  return (
    <div
      className={clx(
        "bg-ui-bg-component relative w-full overflow-hidden rounded-md",
        aspect,
        className
      )}
    >
      {src ? (
        <img src={src} alt={banner.image_alt ?? ""} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="text-ui-fg-muted absolute inset-0 flex flex-col items-center justify-center gap-y-1">
          <Photo />
          <Text size="xsmall">No image yet</Text>
        </div>
      )}
      {src && hasCopy && (
        <>
          <div
            className={clx(
              "absolute inset-0",
              light
                ? "bg-gradient-to-t from-black/60 via-black/10 to-transparent"
                : "bg-gradient-to-t from-white/60 via-white/10 to-transparent"
            )}
          />
          <div
            className={clx(
              "absolute inset-0 flex flex-col justify-end gap-y-1",
              large ? "p-[5%]" : "p-3",
              ALIGN[isTile ? "left" : banner.text_align],
              light ? "text-white" : "text-neutral-900"
            )}
          >
            {banner.eyebrow && (
              <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">
                {banner.eyebrow}
              </span>
            )}
            {banner.title && (
              <span
                className={clx(
                  "font-black uppercase leading-none tracking-tight",
                  large ? "text-2xl" : compact ? "text-sm" : "text-base"
                )}
              >
                {banner.title}
              </span>
            )}
            {banner.subtitle && !isTile && !compact && (
              <span className="max-w-[80%] text-xs opacity-90">{banner.subtitle}</span>
            )}
            {banner.cta_label && (
              <span
                className={clx(
                  "mt-1 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide",
                  isTile
                    ? "px-0 py-0 underline underline-offset-4"
                    : light
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-900 text-white"
                )}
              >
                {banner.cta_label}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}
