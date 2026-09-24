import { Suspense } from "react"

import { getProductFilters } from "@lib/data/products"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilterBar from "@modules/store/components/refinement-list/mobile-filter-bar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default async function CollectionTemplate({
  sortBy,
  collection,
  page,
  countryCode,
  optionValueIds,
  minPrice,
  maxPrice,
}: {
  sortBy?: SortOptions
  collection: HttpTypes.StoreCollection
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  minPrice?: string
  maxPrice?: string
}) {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const minPriceNumber = minPrice ? Number(minPrice) : undefined
  const maxPriceNumber = maxPrice ? Number(maxPrice) : undefined

  const { optionGroups } = await getProductFilters({
    collectionId: collection.id,
    countryCode,
  })

  return (
    <div className="flex flex-col small:flex-row small:items-start py-6 content-container">
      <RefinementList optionGroups={optionGroups} />
      <div className="w-full min-w-0">
        <MobileFilterBar sortBy={sort} optionGroups={optionGroups} />
        <div className="mb-8 mt-6 small:mt-0 text-2xl-semi">
          <h1>{collection.title}</h1>
        </div>
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={collection.products?.length}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            collectionId={collection.id}
            countryCode={countryCode}
            optionValueIds={optionValueIds}
            minPrice={minPriceNumber}
            maxPrice={maxPriceNumber}
          />
        </Suspense>
      </div>
    </div>
  )
}
