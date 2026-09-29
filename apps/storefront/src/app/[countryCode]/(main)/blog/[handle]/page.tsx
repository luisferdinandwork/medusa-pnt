import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getArticle } from "@lib/data/content"
import { getStoreConfig } from "@lib/data/store-config"
import { getBaseURL } from "@lib/util/env"
import { articleSchema, breadcrumbSchema, faqSchema } from "@lib/util/json-ld"
import { Markdown, stripMarkdown } from "@lib/util/markdown"
import AnswerBox from "@modules/blog/components/answer-box"
import ArticleCard from "@modules/blog/components/article-card"
import ArticleMeta from "@modules/blog/components/article-meta"
import Breadcrumbs from "@modules/blog/components/breadcrumbs"
import FaqList from "@modules/blog/components/faq-list"
import JsonLd from "@modules/blog/components/json-ld"
import LinkedProducts from "@modules/blog/components/linked-products"
import SourcesList from "@modules/blog/components/sources-list"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const data = await getArticle(handle)

  if (!data) {
    return { title: "Artikel tidak ditemukan" }
  }

  const { article } = data
  const storeConfig = await getStoreConfig()
  const url = `${getBaseURL()}/${countryCode}/blog/${article.handle}`
  const description =
    article.seo_description ||
    article.excerpt ||
    (article.content ? stripMarkdown(article.content).slice(0, 155) : "")
  const image = article.og_image_url || article.cover_image_url || undefined

  return {
    title: `${article.seo_title || article.title} | ${storeConfig.shortName}`,
    description,
    keywords: article.seo_keywords ?? article.tags ?? undefined,
    authors: article.author_name ? [{ name: article.author_name }] : undefined,
    alternates: { canonical: article.canonical_url || url },
    robots: article.noindex ? { index: false, follow: true } : undefined,
    openGraph: {
      type: "article",
      url,
      title: article.seo_title || article.title,
      description,
      publishedTime: article.published_at ?? undefined,
      modifiedTime: article.updated_at,
      section: article.category ?? undefined,
      tags: article.tags ?? undefined,
      images: image ? [image] : undefined,
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: article.seo_title || article.title,
      description,
      images: image ? [image] : undefined,
    },
  }
}

export default async function ArticlePage(props: PageProps) {
  const { countryCode, handle } = await props.params
  const data = await getArticle(handle)

  if (!data) {
    notFound()
  }

  const { article, related } = data
  const storeConfig = await getStoreConfig()
  const baseUrl = `${getBaseURL()}/${countryCode}`
  const url = `${baseUrl}/blog/${article.handle}`

  return (
    <>
      <JsonLd
        data={[
          articleSchema(article, { url, siteName: storeConfig.name }),
          breadcrumbSchema([
            { name: "Beranda", url: baseUrl },
            { name: "Articles", url: `${baseUrl}/blog` },
            { name: article.title, url },
          ]),
          ...(article.faqs?.length ? [faqSchema(article.faqs)] : []),
        ]}
      />

      <article className="content-container py-10 small:py-16">
        <div className="mx-auto flex max-w-3xl flex-col gap-y-8">
          <Breadcrumbs
            items={[
              { label: "Beranda", href: "/" },
              { label: "Articles", href: "/blog" },
              { label: article.title },
            ]}
          />

          <header className="flex flex-col gap-y-5">
            {article.category && (
              <LocalizedClientLink
                href={`/blog?kategori=${encodeURIComponent(article.category)}`}
                className="w-fit text-xs font-semibold uppercase tracking-widest text-red-500 hover:text-red-600"
              >
                {article.category}
              </LocalizedClientLink>
            )}
            <h1 className="font-display uppercase text-4xl small:text-6xl leading-[0.92]">
              {article.title}
            </h1>
            {article.subtitle && (
              <p className="text-xl text-ink-500 leading-snug">
                {article.subtitle}
              </p>
            )}
          </header>

          {article.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.cover_image_url}
              alt={article.cover_image_alt ?? ""}
              className="w-full rounded-large object-cover"
            />
          )}

          <ArticleMeta article={article} />

          <AnswerBox
            summary={article.answer_summary}
            takeaways={article.key_takeaways}
          />

          {article.content && (
            <div className="text-base">
              <Markdown content={article.content} />
            </div>
          )}

          {article.tags?.length ? (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {article.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-paper-200 px-3 py-1 text-xs uppercase tracking-wide text-ink-500"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <FaqList faqs={article.faqs} />

          <SourcesList sources={article.sources} />
        </div>
      </article>

      {article.related_product_handles?.length ? (
        <div className="content-container pb-16 small:pb-24">
          <div className="border-t border-paper-200 pt-12">
            <LinkedProducts
              handles={article.related_product_handles}
              countryCode={countryCode}
              eyebrow="Disebut di artikel ini"
              title="Produk terkait"
            />
          </div>
        </div>
      ) : null}

      {related.length > 0 && (
        <div className="bg-paper-100 border-t border-paper-200">
          <div className="content-container py-16 small:py-20 flex flex-col gap-y-8">
            <h2 className="font-display uppercase text-3xl">Baca berikutnya</h2>
            <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-3 gap-x-8 gap-y-12">
              {related.map((entry) => (
                <ArticleCard key={entry.id} article={entry} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
