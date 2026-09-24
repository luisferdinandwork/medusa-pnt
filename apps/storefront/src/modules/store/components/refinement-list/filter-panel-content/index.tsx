import CategoryFilter, { CategoryFilterItem } from "../category-filter"
import OptionsPicker, { OptionFilterGroup } from "../options-picker"
import PriceFilter from "../price-filter"

type FilterPanelContentProps = {
  categories?: CategoryFilterItem[]
  currentCategoryHandle?: string
  optionGroups: OptionFilterGroup[]
  selectedValueIds: string[]
  setOptionValueIds: (valueIds: string[]) => void
  minPrice?: string
  maxPrice?: string
  onApplyPrice: (min?: string, max?: string) => void
  hasActiveFilters: boolean
  onClearAll: () => void
}

const FilterPanelContent = ({
  categories,
  currentCategoryHandle,
  optionGroups,
  selectedValueIds,
  setOptionValueIds,
  minPrice,
  maxPrice,
  onApplyPrice,
  hasActiveFilters,
  onClearAll,
}: FilterPanelContentProps) => {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between pb-2">
        <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          Filter
        </span>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs font-semibold uppercase tracking-wide text-red-500 hover:text-red-600"
          >
            Hapus Semua
          </button>
        )}
      </div>
      {categories && (
        <CategoryFilter
          categories={categories}
          currentHandle={currentCategoryHandle}
        />
      )}
      <OptionsPicker
        optionGroups={optionGroups}
        selectedValueIds={selectedValueIds}
        setOptionValueIds={setOptionValueIds}
      />
      <PriceFilter minPrice={minPrice} maxPrice={maxPrice} onApply={onApplyPrice} />
    </div>
  )
}

export default FilterPanelContent
