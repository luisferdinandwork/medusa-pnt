import { getStoryForProduct } from "@lib/data/content"
import { Button } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The silo story a product belongs to, shown on the product page. It gives the
 * product an editorial context and links it to the rest of its family.
 */
export default async function ProductStoryTeaser({
  productHandle,
}: {
  productHandle: string | null | undefined
}) {
  if (!productHandle) {
    return null
  }

  const story = await getStoryForProduct(productHandle)

  if (!story) {
    return null
  }

  const highlights = (story.highlights ?? []).slice(0, 4)

  return (
    <section className="bg-ink text-white">
      <div className="content-container py-16 small:py-24 grid grid-cols-1 small:grid-cols-[1.2fr_1fr] gap-10 small:gap-16 items-start">
        <div className="flex flex-col gap-y-5">
          <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
            Cerita silo &middot; {story.silo}
          </span>
          <h2 className="font-display uppercase text-3xl small:text-4xl leading-[0.95]">
            {story.title}
          </h2>
          {(story.excerpt || story.intro) && (
            <p className="text-white/60 max-w-xl leading-relaxed">
              {story.excerpt || story.intro}
            </p>
          )}
          <LocalizedClientLink href={`/stories/${story.handle}`} className="w-fit">
            <Button
              variant="secondary"
              className="bg-transparent border-white text-white hover:bg-white hover:text-ink"
            >
              Baca cerita lengkap
            </Button>
          </LocalizedClientLink>
        </div>

        {highlights.length > 0 && (
          <dl className="w-full divide-y divide-white/10 border-y border-white/10">
            {highlights.map((highlight, index) => (
              <div
                key={index}
                className="flex items-baseline justify-between gap-x-4 py-3"
              >
                <dt className="text-xs font-semibold uppercase tracking-widest text-white/50">
                  {highlight.label}
                </dt>
                <dd className="text-small-regular text-right">
                  {highlight.value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  )
}
