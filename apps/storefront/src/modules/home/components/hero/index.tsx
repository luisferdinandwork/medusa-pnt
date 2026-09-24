import { getStoreConfig } from "@lib/data/store-config"
import { renderHeading } from "@lib/util/render-heading"
import { Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const Hero = async () => {
  const { hero } = await getStoreConfig()

  if (!hero.heading) {
    return null
  }

  return (
    <div className="w-full border-b border-paper-200 relative bg-paper overflow-hidden">
      <div className="content-container relative py-16 small:py-24 grid grid-cols-1 small:grid-cols-2 gap-12 items-center">
        <div className="relative z-10 flex flex-col gap-6 animate-enter">
          {hero.eyebrow && (
            <div className="flex items-center gap-x-3">
              <span className="h-[2px] w-8 bg-red-500" />
              <Text className="text-xs font-semibold uppercase tracking-widest text-red-500">
                {hero.eyebrow}
              </Text>
            </div>
          )}
          <h1 className="font-display uppercase text-5xl small:text-6xl leading-[0.95]">
            {renderHeading(hero.heading)}
          </h1>
          {hero.body && (
            <Text className="text-base-regular text-ink-500 max-w-md">
              {hero.body}
            </Text>
          )}
          {(hero.price || hero.comparePrice || hero.badge) && (
            <div className="flex items-center gap-x-3">
              {hero.price && (
                <span className="font-display text-3xl">{hero.price}</span>
              )}
              {hero.comparePrice && (
                <Text className="line-through text-ink-500/50">
                  {hero.comparePrice}
                </Text>
              )}
              {hero.badge && (
                <span className="rounded-full bg-red-50 text-red-600 text-xs font-semibold px-2 py-1">
                  {hero.badge}
                </span>
              )}
            </div>
          )}
          <div className="flex items-center gap-x-6 mt-2">
            <LocalizedClientLink href="/store">
              <Button size="large">{hero.ctaLabel || "Beli Sekarang"}</Button>
            </LocalizedClientLink>
            <LocalizedClientLink href="/store">
              <Button variant="ghost-link">Lihat Koleksi</Button>
            </LocalizedClientLink>
          </div>
        </div>
        <div className="relative aspect-square small:aspect-[4/5] rounded-large overflow-hidden bg-gradient-to-br from-paper-100 via-paper-100 to-red-50 animate-fade-in-right">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #141210 0px, #141210 2px, transparent 2px, transparent 26px)",
            }}
          />
          <span
            aria-hidden
            className="font-display text-[16rem] leading-none text-ink/5 select-none absolute -bottom-10 -right-6"
          >
            09
          </span>
          <span
            aria-hidden
            className="font-display text-[16rem] leading-none text-red-500/10 select-none absolute -bottom-8 -right-3"
          >
            09
          </span>
          {hero.badge && (
            <div className="absolute right-6 top-6 flex items-center gap-x-2 rounded-full bg-white/80 backdrop-blur px-3 py-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-ink-500">
                {hero.badge}
              </span>
            </div>
          )}
          <span className="absolute left-6 bottom-6 font-display text-xs uppercase tracking-[0.3em] text-ink-500/60">
            {hero.eyebrow}
          </span>
        </div>
      </div>
    </div>
  )
}

export default Hero
