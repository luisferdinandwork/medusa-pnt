import type { Banner } from "@lib/data/banners"
import {
  BannerCopy,
  BannerLink,
  BannerPicture,
  BannerShade,
} from "@modules/home/components/banner"

/** Wide campaign images, edge to edge. Several are stacked. */
export default function FeatureBanner({ banners }: { banners: Banner[] }) {
  return (
    <section className="flex flex-col gap-y-1">
      {banners.map((banner) => (
        <BannerLink
          key={banner.id}
          banner={banner}
          className="group relative block aspect-[4/5] w-full overflow-hidden bg-ink md:aspect-[12/5]"
        >
          <BannerPicture
            banner={banner}
            className="transition-transform duration-[1200ms] ease-out group-hover:scale-[1.02]"
          />
          {(banner.title || banner.eyebrow || banner.subtitle) && (
            <BannerShade theme={banner.text_theme} />
          )}
          <div className="absolute inset-0 flex items-end">
            <div className="content-container pb-12 small:pb-16">
              <BannerCopy banner={banner} />
            </div>
          </div>
        </BannerLink>
      ))}
    </section>
  )
}
