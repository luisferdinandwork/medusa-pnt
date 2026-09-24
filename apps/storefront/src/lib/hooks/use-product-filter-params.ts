"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useMemo } from "react"

import {
  OPTION_VALUE_QUERY_KEY,
  parseOptionValueIds,
} from "@lib/util/product-option-filters"

/**
 * Shared query-param state for the product filter UI (option values + price range),
 * used by both the desktop sidebar and the mobile filter drawer so they always stay
 * in sync with the URL.
 */
export function useProductFilterParams() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const updateQueryParams = useCallback(
    (updater: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams.toString())
      updater(params)

      params.delete("page")

      const queryString = params.toString()
      const currentQuery = searchParams.toString()
      const nextPath = queryString ? `${pathname}?${queryString}` : pathname
      const currentPath = currentQuery
        ? `${pathname}?${currentQuery}`
        : pathname

      if (nextPath !== currentPath) {
        router.push(nextPath)
      }
    },
    [pathname, router, searchParams]
  )

  const selectedValueIds = useMemo(
    () => parseOptionValueIds(searchParams),
    [searchParams]
  )

  const minPrice = searchParams.get("minPrice") ?? undefined
  const maxPrice = searchParams.get("maxPrice") ?? undefined

  const setOptionValueIds = useCallback(
    (valueIds: string[]) =>
      updateQueryParams((params) => {
        params.delete(OPTION_VALUE_QUERY_KEY)
        valueIds.forEach((valueId) =>
          params.append(OPTION_VALUE_QUERY_KEY, valueId)
        )
      }),
    [updateQueryParams]
  )

  const applyPrice = useCallback(
    (min?: string, max?: string) =>
      updateQueryParams((params) => {
        if (min) {
          params.set("minPrice", min)
        } else {
          params.delete("minPrice")
        }

        if (max) {
          params.set("maxPrice", max)
        } else {
          params.delete("maxPrice")
        }
      }),
    [updateQueryParams]
  )

  const clearAll = useCallback(
    () =>
      updateQueryParams((params) => {
        params.delete(OPTION_VALUE_QUERY_KEY)
        params.delete("minPrice")
        params.delete("maxPrice")
      }),
    [updateQueryParams]
  )

  const hasActiveFilters =
    selectedValueIds.length > 0 || !!minPrice || !!maxPrice

  const activeFilterCount =
    selectedValueIds.length + (minPrice || maxPrice ? 1 : 0)

  return {
    selectedValueIds,
    minPrice,
    maxPrice,
    setOptionValueIds,
    applyPrice,
    clearAll,
    hasActiveFilters,
    activeFilterCount,
  }
}
