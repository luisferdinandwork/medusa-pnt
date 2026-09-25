import { listArticles } from "@lib/data/content"
import ArticleCard from "@modules/blog/components/article-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

/**
 * The three newest articles on the homepage. Beyond being useful to a reader,
 * it gives the blog an internal link from the most-crawled page on the site.
 */
export default async function JournalStrip() {
  const { articles } = await listArticles({ limit: "3" })

  if (!articles.length) {
    return null
  }

  return (
    <div className="content-container py-16 small:py-24 border-t border-paper-200">
      <div className="flex flex-col gap-y-2 small:flex-row small:items-end small:justify-between mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Jurnal
          </span>
          <h2 className="font-display uppercase text-3xl small:text-4xl mt-2">
            Sebelum kamu beli
          </h2>
        </div>
        <LocalizedClientLink
          href="/blog"
          className="text-xs font-semibold uppercase tracking-widest text-ink-500 hover:text-red-500 transition-colors"
        >
          Semua tulisan &rarr;
        </LocalizedClientLink>
      </div>
      <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-12">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
