import type { Article } from "@lib/data/content"
import { formatArticleDate } from "@modules/blog/components/article-meta"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const CoverArt = ({
  seed,
  className = "",
}: {
  seed: string
  className?: string
}) => (
  <div
    className={`relative overflow-hidden rounded-large bg-ink ${className}`}
    aria-hidden
  >
    <div
      className="absolute inset-0 opacity-[0.07]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(115deg, #ffffff 0px, #ffffff 2px, transparent 2px, transparent 22px)",
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-br from-red-500/25 to-transparent" />
    <span className="font-display absolute -bottom-6 -right-2 select-none text-[9rem] leading-none text-white/[0.07]">
      {seed}
    </span>
    <span
      aria-hidden
      className="absolute left-5 bottom-5 h-1.5 w-1.5 rounded-full bg-red-500"
    />
  </div>
)

/** The large card at the top of the blog index. */
export const FeaturedArticleCard = ({ article }: { article: Article }) => (
  <LocalizedClientLink
    href={`/blog/${article.handle}`}
    className="group grid grid-cols-1 small:grid-cols-2 gap-8 small:gap-12 items-center"
  >
    <div className="relative aspect-[4/3] w-full">
      {article.cover_image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.cover_image_url}
          alt={article.cover_image_alt ?? ""}
          className="absolute inset-0 h-full w-full rounded-large object-cover"
        />
      ) : (
        <CoverArt
          seed={article.title.slice(0, 1).toUpperCase()}
          className="h-full w-full"
        />
      )}
    </div>
    <div className="flex flex-col gap-y-4">
      <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
        {article.category || "Jurnal"}
      </span>
      <h2 className="font-display uppercase text-3xl small:text-5xl leading-[0.95] group-hover:text-red-500 transition-colors">
        {article.title}
      </h2>
      {article.excerpt && (
        <p className="text-ink-500 max-w-xl leading-relaxed">
          {article.excerpt}
        </p>
      )}
      <div className="flex items-center gap-x-3 text-xs uppercase tracking-widest text-ink-500">
        <span>{formatArticleDate(article.published_at)}</span>
        {article.read_minutes ? (
          <>
            <span aria-hidden className="h-1 w-1 rounded-full bg-ink-500/40" />
            <span>{article.read_minutes} menit baca</span>
          </>
        ) : null}
      </div>
    </div>
  </LocalizedClientLink>
)

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <LocalizedClientLink
      href={`/blog/${article.handle}`}
      className="group flex flex-col gap-y-4"
    >
      <div className="relative aspect-[3/2] w-full">
        {article.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={article.cover_image_url}
            alt={article.cover_image_alt ?? ""}
            className="absolute inset-0 h-full w-full rounded-large object-cover"
          />
        ) : (
          <CoverArt
            seed={article.title.slice(0, 1).toUpperCase()}
            className="h-full w-full"
          />
        )}
      </div>
      <div className="flex flex-col gap-y-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
          {article.category || "Jurnal"}
        </span>
        <h3 className="font-display uppercase text-xl leading-tight group-hover:text-red-500 transition-colors">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="text-small-regular text-ink-500 line-clamp-3">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center gap-x-2 text-[11px] uppercase tracking-widest text-ink-500/70 pt-1">
          <span>{formatArticleDate(article.published_at)}</span>
          {article.read_minutes ? (
            <>
              <span aria-hidden className="h-1 w-1 rounded-full bg-ink-500/30" />
              <span>{article.read_minutes} menit</span>
            </>
          ) : null}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
