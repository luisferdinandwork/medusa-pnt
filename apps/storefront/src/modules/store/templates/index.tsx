import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCategoryProductCounts, getProductFilters } from "@lib/data/products"
import { buildCategoryMenu, categoryBranchIds } from "@lib/util/category-tree"
import { OptionValueIds } from "@lib/util/product-option-filters"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import MobileFilterBar from "@modules/store/components/refinement-list/mobile-filter-bar"
import RefinementList from "@modules/store/components/refinement-list"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

import PaginatedProducts from "./paginated-products"

const StoreTemplate = async ({
  sortBy,
  page,
  countryCode,
  optionValueIds,
  minPrice,
  maxPrice,
}: {
  sortBy?: SortOptions
  page?: string
  countryCode: string
  optionValueIds?: OptionValueIds
  minPrice?: string
  maxPrice?: string
}) => {
  const pageNumber = page ? parseInt(page) : 1
  const sort = sortBy || "created_at"
  const minPriceNumber = minPrice ? Number(minPrice) : undefined
  const maxPriceNumber = maxPrice ? Number(maxPrice) : undefined

  const [allCategories, { optionGroups }] = await Promise.all([
    listCategories(),
    getProductFilters({ countryCode }),
  ])

  const menu = buildCategoryMenu(allCategories || [])

  const categoryCounts = await getCategoryProductCounts({
    branches: menu.map((c) => ({
      id: c.id,
      ids: categoryBranchIds(c.id, allCategories || []),
    })),
    countryCode,
  })

  const categories = menu.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    count: categoryCounts[c.id] ?? 0,
    children: c.children.map(({ id, name, handle }) => ({ id, name, handle })),
  }))

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        categories={categories}
        optionGroups={optionGroups}
        data-testid="sort-by-container"
      />
      <div className="w-full min-w-0">
        <MobileFilterBar
          sortBy={sort}
          categories={categories}
          optionGroups={optionGroups}
        />
        <div className="mb-8 mt-6 small:mt-0">
          <h1
            data-testid="store-page-title"
            className="font-display uppercase text-3xl"
          >
            Semua Produk
          </h1>
        </div>
        <Suspense fallback={<SkeletonProductGrid />}>
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
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

export default StoreTemplate
