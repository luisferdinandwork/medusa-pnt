import { Metadata } from "next"

import { listArticles, listProductStories } from "@lib/data/content"
import { getStoreConfig } from "@lib/data/store-config"
import { getBaseURL } from "@lib/util/env"
import { blogListSchema, breadcrumbSchema } from "@lib/util/json-ld"
import ArticleCard, {
  FeaturedArticleCard,
} from "@modules/blog/components/article-card"
import Breadcrumbs from "@modules/blog/components/breadcrumbs"
import JsonLd from "@modules/blog/components/json-ld"
import StoryCard from "@modules/blog/components/story-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string }>
  searchParams: Promise<{ kategori?: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { countryCode } = await props.params
  const storeConfig = await getStoreConfig()
  const url = `${getBaseURL()}/${countryCode}/blog`

  return {
    title: `Jurnal ${storeConfig.shortName} | Panduan, Perawatan & Cerita Lapangan`,
    description: `Panduan memilih sepatu, tips perawatan, dan cerita lapangan dari ${storeConfig.name}. Ditulis untuk pemain dan pelari di Indonesia.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Jurnal ${storeConfig.shortName}`,
      description: `Panduan, perawatan, dan cerita lapangan dari ${storeConfig.name}.`,
    },
  }
}

export default async function BlogIndexPage(props: PageProps) {
  const { countryCode } = await props.params
  const { kategori } = await props.searchParams

  const [storeConfig, { articles }, { product_stories }] = await Promise.all([
    getStoreConfig(),
    listArticles({ limit: "50" }),
    listProductStories({ limit: "4" }),
  ])

  const categories = Array.from(
    new Set(articles.map((article) => article.category).filter(Boolean))
  ) as string[]

  const visible = kategori
    ? articles.filter((article) => article.category === kategori)
    : articles

  const featured = !kategori
    ? visible.find((article) => article.is_featured) ?? visible[0]
    : undefined
  const rest = featured
    ? visible.filter((article) => article.id !== featured.id)
    : visible

  const baseUrl = `${getBaseURL()}/${countryCode}`

  return (
    <>
      <JsonLd
        data={[
          blogListSchema(articles, {
            url: `${baseUrl}/blog`,
            siteName: storeConfig.name,
            baseUrl,
          }),
          breadcrumbSchema([
            { name: "Beranda", url: baseUrl },
            { name: "Jurnal", url: `${baseUrl}/blog` },
          ]),
        ]}
      />

      <div className="content-container py-10 small:py-16 flex flex-col gap-y-10">
        <div className="flex flex-col gap-y-6">
          <Breadcrumbs
            items={[{ label: "Beranda", href: "/" }, { label: "Jurnal" }]}
          />
          <div className="flex flex-col gap-y-4 max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
              Jurnal {storeConfig.shortName}
            </span>
            <h1 className="font-display uppercase text-4xl small:text-6xl leading-[0.92]">
              Panduan, perawatan,
              <br />
              dan <span className="text-red-500">cerita lapangan</span>.
            </h1>
            <p className="text-ink-500 leading-relaxed max-w-xl">
              Tulisan yang menjawab pertanyaan yang benar-benar ditanyakan di
              toko: sol mana untuk lapangan mana, ukuran apa yang pas, dan kapan
              sepatu sebaiknya diganti.
            </p>
          </div>
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-y border-paper-200 py-4">
            <LocalizedClientLink
              href="/blog"
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                kategori
                  ? "border-paper-200 text-ink-500 hover:border-ink"
                  : "border-ink bg-ink text-white"
              }`}
            >
              Semua
            </LocalizedClientLink>
            {categories.map((category) => (
              <LocalizedClientLink
                key={category}
                href={`/blog?kategori=${encodeURIComponent(category)}`}
                className={`rounded-full border px-4 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
                  kategori === category
                    ? "border-ink bg-ink text-white"
                    : "border-paper-200 text-ink-500 hover:border-ink"
                }`}
              >
                {category}
              </LocalizedClientLink>
            ))}
          </div>
        )}

        {visible.length === 0 && (
          <div className="py-20 text-center">
            <p className="font-display uppercase text-2xl">Belum ada tulisan</p>
            <p className="text-ink-500 mt-2">
              Artikel yang diterbitkan dari admin akan muncul di sini.
            </p>
          </div>
        )}

        {featured && <FeaturedArticleCard article={featured} />}

        {rest.length > 0 && (
          <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-12 border-t border-paper-200 pt-12">
            {rest.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        )}
      </div>

      {product_stories.length > 0 && (
        <div className="bg-paper-100 border-y border-paper-200">
          <div className="content-container py-16 small:py-20 flex flex-col gap-y-8">
            <div className="flex flex-col gap-y-2 small:flex-row small:items-end small:justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
                  Cerita produk
                </span>
                <h2 className="font-display uppercase text-3xl small:text-4xl mt-2">
                  Satu halaman per silo
                </h2>
              </div>
              <LocalizedClientLink
                href="/stories"
                className="text-xs font-semibold uppercase tracking-widest text-ink-500 hover:text-red-500 transition-colors"
              >
                Lihat semua &rarr;
              </LocalizedClientLink>
            </div>
            <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-4 gap-6">
              {product_stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
