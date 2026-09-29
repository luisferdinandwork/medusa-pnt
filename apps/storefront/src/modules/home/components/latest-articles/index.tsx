import { listArticles } from "@lib/data/content"
import ArticleCard from "@modules/blog/components/article-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const LATEST_COUNT = 4

/**
 * The four newest articles on the homepage. Beyond being useful to a reader,
 * it gives the blog an internal link from the most-crawled page on the site.
 */
export default async function LatestArticles() {
  const { articles } = await listArticles({ limit: String(LATEST_COUNT) })

  if (!articles.length) {
    return null
  }

  return (
    <div className="content-container py-16 small:py-24 border-t border-paper-200">
      <div className="flex flex-col gap-y-2 small:flex-row small:items-end small:justify-between mb-10">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Latest Articles
          </span>
          <h2 className="font-display uppercase text-3xl small:text-4xl mt-2">
            Sebelum kamu beli
          </h2>
        </div>
        <LocalizedClientLink
          href="/blog"
          className="text-xs font-semibold uppercase tracking-widest text-ink-500 hover:text-red-500 transition-colors"
          data-testid="latest-articles-link"
        >
          Semua artikel &rarr;
        </LocalizedClientLink>
      </div>
      <div className="grid grid-cols-1 xsmall:grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-12">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  )
}
