import { Metadata } from "next"

import { parseOptionValueIds } from "@lib/util/product-option-filters"
import { getStoreConfig } from "@lib/data/store-config"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import StoreTemplate from "@modules/store/templates"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: `Semua Produk | ${storeConfig.shortName}`,
    description: "Jelajahi semua produk kami.",
  }
}

type StorePageSearchParams = Record<string, string | string[] | undefined> & {
  sortBy?: SortOptions
  page?: string
  optionValueIds?: string | string[]
  minPrice?: string
  maxPrice?: string
}

type Params = {
  searchParams: Promise<StorePageSearchParams>
  params: Promise<{
    countryCode: string
  }>
}

export default async function StorePage(props: Params) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const { sortBy, page, minPrice, maxPrice } = searchParams
  const optionValueIds = parseOptionValueIds(searchParams)

  return (
    <StoreTemplate
      sortBy={sortBy}
      page={page}
      countryCode={params.countryCode}
      optionValueIds={optionValueIds}
      minPrice={minPrice}
      maxPrice={maxPrice}
    />
  )
}
