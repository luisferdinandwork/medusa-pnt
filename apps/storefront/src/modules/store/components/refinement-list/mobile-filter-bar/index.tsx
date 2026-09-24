"use client"

import { Adjustments } from "@medusajs/icons"
import { useState } from "react"

import { useProductFilterParams } from "@lib/hooks/use-product-filter-params"

import { CategoryFilterItem } from "../category-filter"
import FilterDrawer from "../filter-drawer"
import FilterPanelContent from "../filter-panel-content"
import { OptionFilterGroup } from "../options-picker"
import SortProducts, { SortOptions } from "../sort-products"

type MobileFilterBarProps = {
  sortBy?: SortOptions
  categories?: CategoryFilterItem[]
  currentCategoryHandle?: string
  optionGroups: OptionFilterGroup[]
}

const MobileFilterBar = ({
  sortBy,
  categories,
  currentCategoryHandle,
  optionGroups,
}: MobileFilterBarProps) => {
  const [open, setOpen] = useState(false)
  const {
    selectedValueIds,
    minPrice,
    maxPrice,
    setOptionValueIds,
    applyPrice,
    clearAll,
    hasActiveFilters,
    activeFilterCount,
  } = useProductFilterParams()

  return (
    <div className="small:hidden sticky top-16 z-30 -mx-6 flex items-center gap-x-3 border-b border-paper-200 bg-paper/95 px-6 py-3 backdrop-blur">
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 flex-1 items-center justify-center gap-x-2 rounded-full border border-ink text-sm font-semibold uppercase tracking-wide text-ink"
        data-testid="open-filter-drawer"
      >
        <Adjustments />
        Filter
        {hasActiveFilters && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {activeFilterCount}
          </span>
        )}
      </button>
      <div className="flex-1">
        <SortProducts sortBy={sortBy} compact data-testid="mobile-sort-by" />
      </div>
      <FilterDrawer open={open} onClose={() => setOpen(false)}>
        <FilterPanelContent
          categories={categories}
          currentCategoryHandle={currentCategoryHandle}
          optionGroups={optionGroups}
          selectedValueIds={selectedValueIds}
          setOptionValueIds={setOptionValueIds}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onApplyPrice={applyPrice}
          hasActiveFilters={hasActiveFilters}
          onClearAll={clearAll}
        />
      </FilterDrawer>
    </div>
  )
}

export default MobileFilterBar
