"use client"

import { useProductFilterParams } from "@lib/hooks/use-product-filter-params"

import { CategoryFilterItem } from "./category-filter"
import FilterPanelContent from "./filter-panel-content"
import { OptionFilterGroup } from "./options-picker"

type RefinementListProps = {
  categories?: CategoryFilterItem[]
  currentCategoryHandle?: string
  optionGroups: OptionFilterGroup[]
  "data-testid"?: string
}

const RefinementList = ({
  categories,
  currentCategoryHandle,
  optionGroups,
  "data-testid": dataTestId,
}: RefinementListProps) => {
  const {
    selectedValueIds,
    minPrice,
    maxPrice,
    setOptionValueIds,
    applyPrice,
    clearAll,
    hasActiveFilters,
  } = useProductFilterParams()

  return (
    <aside
      className="hidden small:block small:w-[260px] small:shrink-0 small:sticky small:top-16 small:max-h-[calc(100vh-4rem)] small:overflow-y-auto small:pr-6 small:pb-8"
      data-testid={dataTestId}
    >
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
    </aside>
  )
}

export default RefinementList
