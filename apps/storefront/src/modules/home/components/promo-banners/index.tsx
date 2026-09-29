import type { Banner } from "@lib/data/banners"
import {
  BannerCopy,
  BannerLink,
  BannerPicture,
  BannerShade,
} from "@modules/home/components/banner"

/**
 * Side-by-side product or collection promos, two per row. An odd one out
 * spans the full width so the grid never ends with a hole.
 */
export default function PromoBanners({ promos }: { promos: Banner[] }) {
  return (
    <section className="content-container grid grid-cols-1 gap-4 py-12 small:grid-cols-2 small:py-16">
      {promos.map((promo, index) => {
        const spansRow = promos.length % 2 === 1 && index === promos.length - 1
        return (
          <BannerLink
            key={promo.id}
            banner={promo}
            className={
              spansRow
                ? "group relative block aspect-[4/3] overflow-hidden rounded-large bg-paper-100 small:col-span-2 small:aspect-[12/5]"
                : "group relative block aspect-[4/3] overflow-hidden rounded-large bg-paper-100"
            }
          >
            <BannerPicture
              banner={promo}
              className="transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            />
            <BannerShade theme={promo.text_theme} />
            <div className="absolute inset-0 flex items-end p-6 small:p-8">
              <BannerCopy banner={promo} size="medium" className="w-full" />
            </div>
          </BannerLink>
        )
      })}
    </section>
  )
}
