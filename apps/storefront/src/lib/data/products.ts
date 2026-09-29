"use server"

import { sdk } from "@lib/config"
import { OptionValueIds } from "@lib/util/product-option-filters"
import { sortProducts } from "@lib/util/sort-products"
import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"
import { getAuthHeaders, getCacheOptions } from "./cookies"

// Product data (images, videos, descriptions) edited in the admin shows up
// within a minute; without a revalidate window the cached copy never expires.
const productFetch = { revalidate: 60 } as const
import { getRegion, retrieveRegion } from "./regions"

type ProductListQueryParams = (HttpTypes.FindParams &
  HttpTypes.StoreProductListParams) & {
  options?: string[]
  option_value_id?: string | string[]
}

export const listProducts = async ({
  pageParam = 1,
  queryParams,
  countryCode,
  regionId,
}: {
  pageParam?: number
  queryParams?: ProductListQueryParams
  countryCode?: string
  regionId?: string
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  if (!countryCode && !regionId) {
    throw new Error("Country code or region ID is required")
  }

  const limit = queryParams?.limit || 12
  const _pageParam = Math.max(pageParam, 1)
  const offset = _pageParam === 1 ? 0 : (_pageParam - 1) * limit

  let region: HttpTypes.StoreRegion | undefined | null

  if (countryCode) {
    region = await getRegion(countryCode)
  } else {
    region = await retrieveRegion(regionId!)
  }

  if (!region) {
    return {
      response: { products: [], count: 0 },
      nextPage: null,
    }
  }

  const headers = {
    ...(await getAuthHeaders()),
  }

  const next = {
    ...(await getCacheOptions("products")),
    ...productFetch,
  }

  return sdk.client
    .fetch<{ products: HttpTypes.StoreProduct[]; count: number }>(
      `/store/products`,
      {
        method: "GET",
        query: {
          limit,
          offset,
          region_id: region?.id,
          fields:
            "*variants.calculated_price,+variants.inventory_quantity,*variants.images,*variants.options,+metadata,+tags,",
          ...queryParams,
        },
        headers,
        next,
        cache: "force-cache",
      }
    )
    .then(({ products, count }) => {
      const nextPage = count > offset + limit ? pageParam + 1 : null

      return {
        response: {
          products,
          count,
        },
        nextPage: nextPage,
        queryParams,
      }
    })
}

const getLowestVariantPrice = (
  product: HttpTypes.StoreProduct
): number | undefined => {
  const prices = (product.variants || [])
    .map((variant) => variant?.calculated_price?.calculated_amount)
    .filter((amount): amount is number => typeof amount === "number")

  return prices.length ? Math.min(...prices) : undefined
}

/**
 * This will fetch 100 products to the Next.js cache and sort them based on the sortBy parameter.
 * It will then return the paginated products based on the page and limit parameters.
 */
export const listProductsWithSort = async ({
  page = 0,
  queryParams,
  sortBy = "created_at",
  countryCode,
  optionValueIds,
  minPrice,
  maxPrice,
}: {
  page?: number
  queryParams?: ProductListQueryParams
  sortBy?: SortOptions
  countryCode: string
  optionValueIds?: OptionValueIds
  minPrice?: number
  maxPrice?: number
}): Promise<{
  response: { products: HttpTypes.StoreProduct[]; count: number }
  nextPage: number | null
  queryParams?: ProductListQueryParams
}> => {
  const limit = queryParams?.limit || 12
  const optionFilters = Array.from(
    new Set((optionValueIds || []).filter(Boolean))
  )

  const {
    response: { products },
  } = await listProducts({
    pageParam: 0,
    queryParams: {
      ...queryParams,
      ...(optionFilters.length ? { option_value_id: optionFilters } : {}),
      limit: 100,
    },
    countryCode,
  })

  const priceFilteredProducts =
    typeof minPrice === "number" || typeof maxPrice === "number"
      ? products.filter((product) => {
          const lowestPrice = getLowestVariantPrice(product)

          if (lowestPrice === undefined) {
            return false
          }

          if (typeof minPrice === "number" && lowestPrice < minPrice) {
            return false
          }

          if (typeof maxPrice === "number" && lowestPrice > maxPrice) {
            return false
          }

          return true
        })
      : products

  const sortedProducts = sortProducts(priceFilteredProducts, sortBy)

  const pageParam = (page - 1) * limit

  const filteredCount = sortedProducts.length

  const nextPage = filteredCount > pageParam + limit ? pageParam + limit : null

  const paginatedProducts = sortedProducts.slice(pageParam, pageParam + limit)

  return {
    response: {
      products: paginatedProducts,
      count: filteredCount,
    },
    nextPage,
    queryParams,
  }
}

export type ProductFilterOptionValue = {
  id: string
  label: string
  rank?: number | null
}
export type ProductFilterOptionGroup = {
  id: string
  title: string
  values: ProductFilterOptionValue[]
}
export type ProductFilters = {
  optionGroups: ProductFilterOptionGroup[]
  priceBounds: { min: number; max: number } | null
}

/**
 * Derives the available filter option groups (e.g. "Ukuran") and the price range
 * from the products that actually exist within the given category/collection, so
 * the filter sidebar never shows a filter that would produce zero results.
 */
export const getProductFilters = async ({
  categoryIds,
  collectionId,
  countryCode,
}: {
  /** A category and its subcategories (see categoryBranchIds). */
  categoryIds?: string[]
  collectionId?: string
  countryCode: string
}): Promise<ProductFilters> => {
  const region = await getRegion(countryCode)

  if (!region) {
    return { optionGroups: [], priceBounds: null }
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")), ...productFetch }

  const query: Record<string, unknown> = {
    limit: 100,
    region_id: region.id,
    fields: "id,title,*options,*options.values,*variants.calculated_price",
  }

  if (categoryIds?.length) {
    query.category_id = categoryIds
  }

  if (collectionId) {
    query.collection_id = [collectionId]
  }

  const { products } = await sdk.client.fetch<{
    products: HttpTypes.StoreProduct[]
  }>("/store/products", {
    method: "GET",
    query,
    headers,
    next,
    cache: "force-cache",
  })

  const groups = new Map<string, ProductFilterOptionGroup>()
  let min = Infinity
  let max = -Infinity

  for (const product of products) {
    for (const option of product.options || []) {
      if (!option.id || !option.title) {
        continue
      }

      const group = groups.get(option.id) ?? {
        id: option.id,
        title: option.title,
        values: [],
      }
      const seen = new Set(group.values.map((v) => v.id))

      for (const value of option.values || []) {
        if (value.id && value.value && !seen.has(value.id)) {
          group.values.push({ id: value.id, label: value.value, rank: value.rank })
          seen.add(value.id)
        }
      }

      groups.set(option.id, group)
    }

    const lowestPrice = getLowestVariantPrice(product)

    if (lowestPrice !== undefined) {
      min = Math.min(min, lowestPrice)
      max = Math.max(max, lowestPrice)
    }
  }

  const sortValues = (values: ProductFilterOptionValue[]) =>
    [...values].sort((a, b) => {
      if (a.rank != null && b.rank != null && a.rank !== b.rank) {
        return a.rank - b.rank
      }
      const aNum = Number(a.label)
      const bNum = Number(b.label)

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        return aNum - bNum
      }

      return a.label.localeCompare(b.label)
    })

  const optionGroups = Array.from(groups.values()).map((group) => ({
    ...group,
    values: sortValues(group.values),
  }))

  return {
    optionGroups,
    priceBounds: Number.isFinite(min) && Number.isFinite(max) ? { min, max } : null,
  }
}

/**
 * Counts products per category the same way the storefront lists them (respecting
 * the publishable key / sales channel), since a category's raw `products` relation
 * can include items that aren't actually purchasable in this store.
 */
export const getCategoryProductCounts = async ({
  branches,
  countryCode,
}: {
  /** Per category, its id and the ids of its whole branch. */
  branches: { id: string; ids: string[] }[]
  countryCode: string
}): Promise<Record<string, number>> => {
  const region = await getRegion(countryCode)

  if (!region) {
    return {}
  }

  const headers = { ...(await getAuthHeaders()) }
  const next = { ...(await getCacheOptions("products")), ...productFetch }

  const entries = await Promise.all(
    branches.map(async ({ id: categoryId, ids }) => {
      const { count } = await sdk.client.fetch<{ count: number }>(
        "/store/products",
        {
          method: "GET",
          query: { limit: 1, category_id: ids, region_id: region.id },
          headers,
          next,
          cache: "force-cache",
        }
      )

      return [categoryId, count] as const
    })
  )

  return Object.fromEntries(entries)
}
