import type { ProductStory } from "@lib/data/content"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default function StoryCard({ story }: { story: ProductStory }) {
  return (
    <LocalizedClientLink
      href={`/stories/${story.handle}`}
      className="group flex flex-col justify-between gap-y-6 rounded-large border border-paper-200 bg-white p-6 small:p-8 transition-colors hover:border-ink"
    >
      <div className="flex flex-col gap-y-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
          {story.product_name}
        </span>
        <h3 className="font-display uppercase text-2xl leading-tight group-hover:text-red-500 transition-colors">
          {story.title}
        </h3>
        {story.subtitle && (
          <p className="text-small-regular text-ink-500">{story.subtitle}</p>
        )}
        {story.excerpt && (
          <p className="text-small-regular text-ink-500 line-clamp-3">
            {story.excerpt}
          </p>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-paper-100 pt-4 text-xs uppercase tracking-widest text-ink-500">
        <span>{story.product_handles?.length ?? 0} produk</span>
        <span className="text-red-500 group-hover:translate-x-1 transition-transform">
          Baca &rarr;
        </span>
      </div>
    </LocalizedClientLink>
  )
}
