import type { Article } from "@lib/data/content"

export const formatArticleDate = (value: string | null) => {
  if (!value) {
    return ""
  }
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

export default function ArticleMeta({ article }: { article: Article }) {
  const initials = (article.author_name ?? "SPECS")
    .split(" ")
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase()

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-y border-paper-200 py-4">
      <div className="flex items-center gap-x-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-[11px] font-semibold text-white">
          {initials}
        </span>
        <div className="flex flex-col">
          <span className="text-small-regular font-semibold">
            {article.author_name ?? "Tim Editorial"}
          </span>
          {article.author_role && (
            <span className="text-xs text-ink-500">{article.author_role}</span>
          )}
        </div>
      </div>
      <span aria-hidden className="h-6 w-px bg-paper-200" />
      <div className="flex flex-wrap items-center gap-x-3 text-xs uppercase tracking-widest text-ink-500">
        {article.published_at && (
          <time dateTime={article.published_at}>
            {formatArticleDate(article.published_at)}
          </time>
        )}
        {article.read_minutes ? (
          <>
            <span aria-hidden className="h-1 w-1 rounded-full bg-ink-500/40" />
            <span>{article.read_minutes} menit baca</span>
          </>
        ) : null}
        {article.geo_target_area && (
          <>
            <span aria-hidden className="h-1 w-1 rounded-full bg-ink-500/40" />
            <span>{article.geo_target_area}</span>
          </>
        )}
      </div>
    </div>
  )
}
