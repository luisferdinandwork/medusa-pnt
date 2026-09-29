import { Metadata } from "next"

import CategoryBanners from "@modules/home/components/category-banners"
import CategoryTiles from "@modules/home/components/category-tiles"
import EditorialSection from "@modules/home/components/editorial-section"
import FeatureBanner from "@modules/home/components/feature-banner"
import GuideTeaser from "@modules/home/components/guide-teaser"
import Hero from "@modules/home/components/hero"
import HeroSlider from "@modules/home/components/hero-slider"
import LatestArticles from "@modules/home/components/latest-articles"
import NewArrivals from "@modules/home/components/new-arrivals"
import OnSaleProducts from "@modules/home/components/on-sale-products"
import PromoBanners from "@modules/home/components/promo-banners"
import { listHomepageBanners } from "@lib/data/banners"
import { getRegion } from "@lib/data/regions"
import { getStoreConfig } from "@lib/data/store-config"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: storeConfig.defaultTitle,
    description: storeConfig.defaultDescription,
  }
}

// Image-first homepage: the banners (admin > Storefronts > Banners) lead into
// categories and products, with product rows in between. Without banners the
// hero and category sections fall back to the text versions from the
// storefront settings.
export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const [region, banners] = await Promise.all([
    getRegion(countryCode),
    listHomepageBanners(),
  ])

  if (!region) {
    return null
  }

  return (
    <>
      {banners.hero.length ? <HeroSlider slides={banners.hero} /> : <Hero />}
      {banners.category.length ? (
        <CategoryBanners tiles={banners.category} />
      ) : (
        <CategoryTiles />
      )}
      <NewArrivals region={region} />
      {banners.promo.length > 0 && <PromoBanners promos={banners.promo} />}
      {banners.feature.length > 0 && <FeatureBanner banners={banners.feature} />}
      <OnSaleProducts region={region} />
      <EditorialSection />
      <GuideTeaser />
      <LatestArticles />
    </>
  )
}
