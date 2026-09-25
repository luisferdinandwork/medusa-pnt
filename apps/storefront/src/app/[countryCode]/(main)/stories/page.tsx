import { Metadata } from "next"

import { listProductStories } from "@lib/data/content"
import { getStoreConfig } from "@lib/data/store-config"
import { getBaseURL } from "@lib/util/env"
import { breadcrumbSchema } from "@lib/util/json-ld"
import Breadcrumbs from "@modules/blog/components/breadcrumbs"
import JsonLd from "@modules/blog/components/json-ld"
import StoryCard from "@modules/blog/components/story-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type PageProps = {
  params: Promise<{ countryCode: string }>
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { countryCode } = await props.params
  const storeConfig = await getStoreConfig()
  const url = `${getBaseURL()}/${countryCode}/stories`

  return {
    title: `Cerita Produk | ${storeConfig.shortName}`,
    description: `Setiap keluarga produk ${storeConfig.name} dijelaskan dalam satu halaman: untuk siapa, di permukaan apa, dan model mana yang cocok.`,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `Cerita Produk ${storeConfig.shortName}`,
      description: `Panduan tiap silo produk ${storeConfig.name}.`,
    },
  }
}

export default async function StoriesIndexPage(props: PageProps) {
  const { countryCode } = await props.params
  const [storeConfig, { product_stories }] = await Promise.all([
    getStoreConfig(),
    listProductStories({ limit: "50" }),
  ])

  const baseUrl = `${getBaseURL()}/${countryCode}`

  return (
    <>
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: `Cerita Produk ${storeConfig.name}`,
            url: `${baseUrl}/stories`,
            inLanguage: "id-ID",
            mainEntity: {
              "@type": "ItemList",
              numberOfItems: product_stories.length,
              itemListElement: product_stories.map((story, index) => ({
                "@type": "ListItem",
                position: index + 1,
                name: story.title,
                url: `${baseUrl}/stories/${story.handle}`,
              })),
            },
          },
          breadcrumbSchema([
            { name: "Beranda", url: baseUrl },
            { name: "Cerita Produk", url: `${baseUrl}/stories` },
          ]),
        ]}
      />

      <div className="content-container py-10 small:py-16 flex flex-col gap-y-10">
        <Breadcrumbs
          items={[{ label: "Beranda", href: "/" }, { label: "Cerita Produk" }]}
        />

        <div className="flex flex-col gap-y-4 max-w-3xl">
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Cerita produk
          </span>
          <h1 className="font-display uppercase text-4xl small:text-6xl leading-[0.92]">
            Satu halaman,
            <br />
            satu <span className="text-red-500">keluarga produk</span>.
          </h1>
          <p className="text-ink-500 leading-relaxed max-w-xl">
            Setiap silo - sepatu bola FG, futsal indoor, daily trainer - punya
            satu halaman yang menjelaskan untuk siapa produknya, di permukaan
            apa, dan bagaimana memilih di antara model yang ada.
          </p>
        </div>

        {product_stories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display uppercase text-2xl">Belum ada cerita</p>
            <p className="text-ink-500 mt-2">
              Cerita produk yang diterbitkan dari admin akan muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xsmall:grid-cols-2 medium:grid-cols-3 gap-6 border-t border-paper-200 pt-10">
            {product_stories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}

        <div className="rounded-large bg-ink text-white p-8 small:p-12 flex flex-col small:flex-row small:items-center justify-between gap-6">
          <div className="max-w-xl">
            <h2 className="font-display uppercase text-2xl small:text-3xl">
              Masih ragu pilih yang mana?
            </h2>
            <p className="text-white/60 mt-2">
              Jurnal kami membahas ukuran, sol, dan perawatan lebih dalam.
            </p>
          </div>
          <LocalizedClientLink
            href="/blog"
            className="w-fit rounded-full bg-red-500 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-red-600 transition-colors"
          >
            Buka jurnal
          </LocalizedClientLink>
        </div>
      </div>
    </>
  )
}
