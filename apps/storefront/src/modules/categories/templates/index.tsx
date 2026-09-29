import { notFound } from "next/navigation"
import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { getCategoryProductCounts, getProductFilters } from "@lib/data/products"
import { buildCategoryMenu, categoryBranchIds } from "@lib/util/category-tree"
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

  const allCategories = (await listCategories()) || []
  // A parent category lists the products of all its subcategories.
  const categoryIds = categoryBranchIds(category.id, allCategories)
  const menu = buildCategoryMenu(allCategories)

  const [{ optionGroups }, categoryCounts] = await Promise.all([
    getProductFilters({ categoryIds, countryCode }),
    getCategoryProductCounts({
      branches: menu.map((c) => ({
        id: c.id,
        ids: categoryBranchIds(c.id, allCategories),
      })),
      countryCode,
    }),
  ])

  const categories = menu.map((c) => ({
    id: c.id,
    name: c.name,
    handle: c.handle,
    count: categoryCounts[c.id] ?? 0,
    children: c.children.map(({ id, name, handle }) => ({ id, name, handle })),
  }))
  const subcategories =
    menu.find((c) => c.id === category.id)?.children ??
    menu.flatMap((c) => c.children).find((c) => c.id === category.id)?.children ??
    []

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
        {subcategories.length > 0 && (
          <ul className="no-scrollbar -mx-6 mb-10 flex gap-3 overflow-x-auto px-6 small:mx-0 small:grid small:grid-cols-4 small:overflow-visible small:px-0">
            {subcategories.map((sub) => (
              <li key={sub.id} className="w-36 shrink-0 small:w-auto">
                <LocalizedClientLink
                  href={`/categories/${sub.handle}`}
                  className="group flex flex-col gap-y-2"
                >
                  <span className="relative block aspect-square overflow-hidden rounded-large bg-photo">
                    {sub.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={sub.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-contain p-2 mix-blend-darken transition-transform duration-500 group-hover:scale-105"
                      />
                    )}
                  </span>
                  <span className="text-sm font-semibold uppercase tracking-wide transition-colors group-hover:text-red-500">
                    {sub.name}
                  </span>
                </LocalizedClientLink>
              </li>
            ))}
          </ul>
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
            categoryIds={categoryIds}
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
