import type { Banner } from "@lib/data/banners"
import { listCategories } from "@lib/data/categories"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { BannerLink, BannerPicture } from "@modules/home/components/banner"

const GRID_COLS: Record<number, string> = {
  1: "small:grid-cols-1",
  2: "small:grid-cols-2",
  3: "small:grid-cols-3",
}

/**
 * Tall photo tiles, one per category, straight under the hero: the fastest
 * way from the homepage into a product list. They scroll sideways on phones.
 */
export default async function CategoryBanners({ tiles }: { tiles: Banner[] }) {
  // A tile without a title shows its category's name.
  const needsNames = tiles.some((tile) => !tile.title && tile.link_type === "category")
  const categories = needsNames ? await listCategories() : []
  const nameOf = (tile: Banner) =>
    tile.title ||
    (tile.link_type === "category"
      ? categories.find((category) => category.handle === tile.link_value)?.name
      : undefined) ||
    ""

  return (
    <section className="py-12 small:py-16">
      <div className="content-container mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Belanja per kategori
          </span>
          <h2 className="font-display mt-1 text-3xl uppercase small:text-4xl">
            Pilih lapanganmu
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="shrink-0 text-xs font-semibold uppercase tracking-widest text-ink-500 transition-colors hover:text-red-500"
        >
          Semua produk &rarr;
        </LocalizedClientLink>
      </div>

      <div className="content-container">
        <ul
          className={clx(
            "no-scrollbar -mx-6 flex snap-x snap-mandatory gap-3 overflow-x-auto px-6",
            "small:mx-0 small:grid small:gap-4 small:overflow-visible small:px-0",
            GRID_COLS[tiles.length] ?? "small:grid-cols-4"
          )}
        >
          {tiles.map((tile) => {
            const name = nameOf(tile)
            return (
              <li
                key={tile.id}
                className="w-[72%] shrink-0 snap-start xsmall:w-[44%] small:w-auto"
              >
                <BannerLink
                  banner={{ ...tile, title: name }}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-large bg-paper-100"
                >
                  <BannerPicture
                    banner={tile}
                    className="transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent"
                  />
                  <div
                    className={clx(
                      "absolute inset-x-0 bottom-0 flex flex-col gap-y-2 p-5 small:p-6",
                      tile.text_theme === "light" ? "text-white" : "text-ink"
                    )}
                  >
                    {name && (
                      <span className="font-display text-2xl uppercase leading-none small:text-3xl">
                        {name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-x-2 text-xs font-semibold uppercase tracking-widest">
                      <span className="underline decoration-2 underline-offset-[6px] transition-colors group-hover:decoration-red-500">
                        {tile.cta_label || "Belanja"}
                      </span>
                      <span
                        aria-hidden
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      >
                        &rarr;
                      </span>
                    </span>
                  </div>
                </BannerLink>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
