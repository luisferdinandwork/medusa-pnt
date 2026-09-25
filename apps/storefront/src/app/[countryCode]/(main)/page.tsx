import { Metadata } from "next"

import CategoryTiles from "@modules/home/components/category-tiles"
import EditorialSection from "@modules/home/components/editorial-section"
import GuideTeaser from "@modules/home/components/guide-teaser"
import Hero from "@modules/home/components/hero"
import JournalStrip from "@modules/home/components/journal-strip"
import NewArrivals from "@modules/home/components/new-arrivals"
import { getRegion } from "@lib/data/regions"
import { getStoreConfig } from "@lib/data/store-config"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: storeConfig.defaultTitle,
    description: storeConfig.defaultDescription,
  }
}

export default async function Home(props: {
  params: Promise<{ countryCode: string }>
}) {
  const params = await props.params

  const { countryCode } = params

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  return (
    <>
      <Hero />
      <CategoryTiles />
      <NewArrivals region={region} />
      <EditorialSection />
      <GuideTeaser />
      <JournalStrip />
    </>
  )
}
