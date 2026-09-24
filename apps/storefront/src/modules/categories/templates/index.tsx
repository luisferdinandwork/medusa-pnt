import { notFound } from "next/navigation"
import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCategoryProductCounts, getProductFilters } from "@lib/data/products"
import InteractiveLink from "@modules/common/components/interactive-link"
import SkeletonProductGrid from "@modules/skeletons/templates/skeleton-product-grid"
import RefinementList from "@modules/store/components/refinement-list"
import MobileFilterBar from "@modules/store/components/refinement-list/mobile-filter-bar"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import PaginatedProducts from "@modules/store/templates/paginated-products"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"
import { OptionValueIds } from "@lib/util/product-option-filters"

export default async function CategoryTemplate({
  category,
  sortBy,
  page,
  countryCode,
  optionValueIds,
  minPrice,
  maxPrice,
}: {
  category: HttpTypes.StoreProductCategory
  sortBy?: SortOptions
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

  if (!category || !countryCode) notFound()

  const parents = [] as HttpTypes.StoreProductCategory[]

  const getParents = (category: HttpTypes.StoreProductCategory) => {
    if (category.parent_category) {
      parents.push(category.parent_category)
      getParents(category.parent_category)
    }
  }

  getParents(category)

  const [allCategories, { optionGroups }] = await Promise.all([
    listCategories(),
    getProductFilters({ categoryId: category.id, countryCode }),
  ])

  const topLevelCategories = (allCategories || []).filter(
    (c) => !c.parent_category
  )

  const categoryCounts = await getCategoryProductCounts({
    categoryIds: topLevelCategories.map((c) => c.id),
    countryCode,
  })

  const categories = topLevelCategories.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    count: categoryCounts[c.id] ?? 0,
  }))

  return (
    <div
      className="flex flex-col small:flex-row small:items-start py-6 content-container"
      data-testid="category-container"
    >
      <RefinementList
        categories={categories}
        currentCategoryHandle={category.handle}
        optionGroups={optionGroups}
        data-testid="sort-by-container"
      />
      <div className="w-full min-w-0">
        <MobileFilterBar
          sortBy={sort}
          categories={categories}
          currentCategoryHandle={category.handle}
          optionGroups={optionGroups}
        />
        <div className="flex flex-row items-center mb-8 mt-6 small:mt-0 gap-4">
          {parents &&
            parents.map((parent) => (
              <span key={parent.id} className="text-ink-500">
                <LocalizedClientLink
                  className="mr-4 hover:text-red-500"
                  href={`/categories/${parent.handle}`}
                  data-testid="sort-by-link"
                >
                  {parent.name}
                </LocalizedClientLink>
                /
              </span>
            ))}
          <h1
            data-testid="category-page-title"
            className="font-display uppercase text-3xl"
          >
            {category.name}
          </h1>
        </div>
        {category.description && (
          <div className="mb-8 text-base-regular">
            <p>{category.description}</p>
          </div>
        )}
        {category.category_children && (
          <div className="mb-8 text-base-large">
            <ul className="grid grid-cols-1 gap-2">
              {category.category_children?.map((c) => (
                <li key={c.id}>
                  <InteractiveLink href={`/categories/${c.handle}`}>
                    {c.name}
                  </InteractiveLink>
                </li>
              ))}
            </ul>
          </div>
        )}
        <Suspense
          fallback={
            <SkeletonProductGrid
              numberOfProducts={category.products?.length ?? 8}
            />
          }
        >
          <PaginatedProducts
            sortBy={sort}
            page={pageNumber}
            categoryId={category.id}
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
