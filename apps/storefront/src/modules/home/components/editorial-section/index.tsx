import { getStoreConfig } from "@lib/data/store-config"
import { renderHeading } from "@lib/util/render-heading"
import { Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function EditorialSection() {
  const { editorial } = await getStoreConfig()

  if (!editorial.heading) {
    return null
  }

  return (
    <div className="bg-ink text-white">
      <div className="content-container py-20 small:py-28 grid grid-cols-1 small:grid-cols-2 gap-12 items-center">
        <div className="flex flex-col gap-y-5">
          {editorial.eyebrow && (
            <Text className="text-xs font-semibold uppercase tracking-widest text-red-400">
              {editorial.eyebrow}
            </Text>
          )}
          <h2 className="font-display uppercase text-4xl small:text-5xl leading-[0.95]">
            {renderHeading(editorial.heading)}
          </h2>
          {editorial.body && (
            <Text className="text-white/60 max-w-md">{editorial.body}</Text>
          )}
          <LocalizedClientLink href="/store" className="w-fit">
            <Button
              variant="secondary"
              className="bg-transparent border-white text-black hover:bg-white/10 hover:text-white"
            >
              {editorial.ctaLabel || "Baca ceritanya"}
            </Button>
          </LocalizedClientLink>
        </div>
        <div className="relative aspect-[4/3] rounded-large border border-white/10 overflow-hidden bg-gradient-to-br from-white/[0.06] to-transparent">
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 26px)",
            }}
          />
          <span
            aria-hidden
            className="font-display text-[13rem] leading-none text-white/[0.06] select-none absolute -bottom-6 -right-4"
          >
            9
          </span>
          <div className="absolute left-6 bottom-6 flex items-center gap-x-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Musim 2026
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
