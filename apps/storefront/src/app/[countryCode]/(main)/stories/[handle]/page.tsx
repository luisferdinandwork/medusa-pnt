import { Metadata } from "next"
import { notFound } from "next/navigation"

import { getProductStory } from "@lib/data/content"
import { getStoreConfig } from "@lib/data/store-config"
import { getBaseURL } from "@lib/util/env"
import { breadcrumbSchema, faqSchema, storySchema } from "@lib/util/json-ld"
import { Markdown } from "@lib/util/markdown"
import Breadcrumbs from "@modules/blog/components/breadcrumbs"
import FaqList from "@modules/blog/components/faq-list"
import JsonLd from "@modules/blog/components/json-ld"
import LinkedProducts from "@modules/blog/components/linked-products"
import StoryCard from "@modules/blog/components/story-card"
import StoryHighlights from "@modules/blog/components/story-highlights"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string; handle: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { countryCode, handle } = await props.params
  const data = await getProductStory(handle)

  if (!data) {
    return { title: "Cerita tidak ditemukan" }
  }

  const { product_story: story } = data
  const storeConfig = await getStoreConfig()
  const url = `${getBaseURL()}/${countryCode}/stories/${story.handle}`
  const description =
    story.seo_description || story.excerpt || story.intro || ""

  return {
    title: `${story.seo_title || story.title} | ${storeConfig.shortName}`,
    description,
    keywords: story.seo_keywords ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: story.seo_title || story.title,
      description,
      images: story.cover_image_url ? [story.cover_image_url] : undefined,
    },
  }
}

export default async function ProductStoryPage(props: PageProps) {
  const { countryCode, handle } = await props.params
  const data = await getProductStory(handle)

  if (!data) {
    notFound()
  }

  const { product_story: story, related } = data
  const storeConfig = await getStoreConfig()
  const baseUrl = `${getBaseURL()}/${countryCode}`
  const url = `${baseUrl}/stories/${story.handle}`

  return (
    <>
      <JsonLd
        data={[
          storySchema(story, {
            url,
            siteName: storeConfig.name,
            productUrls: (story.product_handles ?? []).map((productHandle) => ({
              name: productHandle,
              url: `${baseUrl}/products/${productHandle}`,
            })),
          }),
          breadcrumbSchema([
            { name: "Beranda", url: baseUrl },
            { name: "Product Stories", url: `${baseUrl}/stories` },
            { name: story.title, url },
          ]),
          ...(story.faqs?.length ? [faqSchema(story.faqs)] : []),
        ]}
      />

      <div className="bg-ink text-white">
        <div className="content-container py-12 small:py-20 flex flex-col gap-y-6">
          <Breadcrumbs
            items={[
              { label: "Beranda", href: "/" },
              { label: "Product Stories", href: "/stories" },
              { label: story.title },
            ]}
          />
          <div className="flex flex-col gap-y-4 max-w-3xl">
            <span className="text-xs font-semibold uppercase tracking-widest text-red-400">
              Product Story &middot; {story.product_name}
            </span>
            <h1 className="font-display uppercase text-4xl small:text-6xl leading-[0.92]">
              {story.title}
            </h1>
            {story.subtitle && (
              <p className="text-xl text-white/60 leading-snug">
                {story.subtitle}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs uppercase tracking-widest text-white/50">
            <span>{story.product_handles?.length ?? 0} model produk</span>
            {story.category_handle && (
              <LocalizedClientLink
                href={`/categories/${story.category_handle}`}
                className="hover:text-white transition-colors"
              >
                Lihat kategori &rarr;
              </LocalizedClientLink>
            )}
          </div>
        </div>
      </div>

      {story.cover_image_url && (
        <div className="content-container pt-12 small:pt-16">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.cover_image_url}
            alt={story.cover_image_alt ?? ""}
            className="aspect-[21/9] w-full rounded-large object-cover"
          />
        </div>
      )}

      <div className="content-container py-12 small:py-16">
        <div className="grid grid-cols-1 small:grid-cols-[minmax(0,1fr)_320px] gap-10 small:gap-16 items-start">
          <div className="flex flex-col gap-y-10">
            {story.intro && (
              <p className="text-xl leading-relaxed text-ink">{story.intro}</p>
            )}

            {(story.sections ?? []).map((section, index) => (
              <section key={index} className="flex flex-col gap-y-4">
                <h2 className="font-display uppercase text-2xl small:text-3xl">
                  {section.heading}
                </h2>
                {section.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={section.image_url}
                    alt={section.image_alt ?? ""}
                    loading="lazy"
                    className="w-full rounded-large object-cover"
                  />
                )}
                <Markdown content={section.body} />
              </section>
            ))}

            <FaqList faqs={story.faqs} />
          </div>

          <aside className="flex flex-col gap-y-6 small:sticky small:top-24">
            <StoryHighlights highlights={story.highlights} />
            {story.cta_label && story.cta_href && (
              <LocalizedClientLink
                href={story.cta_href}
                className="rounded-full bg-red-500 px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-white hover:bg-red-600 transition-colors"
              >
                {story.cta_label}
              </LocalizedClientLink>
            )}
            <LocalizedClientLink
              href="/blog"
              className="rounded-full border border-paper-200 px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-ink-500 hover:border-ink hover:text-ink transition-colors"
            >
              Baca artikel
            </LocalizedClientLink>
          </aside>
        </div>
      </div>

      <div className="content-container pb-16 small:pb-24">
        <div className="border-t border-paper-200 pt-12">
          <LinkedProducts
            handles={story.product_handles}
            countryCode={countryCode}
            eyebrow={story.product_name}
            title="Model dalam cerita ini"
          />
        </div>
      </div>

      {related.length > 0 && (
        <div className="bg-paper-100 border-t border-paper-200">
          <div className="content-container py-16 small:py-20 flex flex-col gap-y-8">
            <h2 className="font-display uppercase text-3xl">
              More Product Stories
            </h2>
            <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-3 gap-6">
              {related.map((entry) => (
                <StoryCard key={entry.id} story={entry} />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
