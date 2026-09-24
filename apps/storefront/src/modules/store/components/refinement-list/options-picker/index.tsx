"use client"

import { getColorSwatch } from "@lib/util/color-swatch-map"
import { clx } from "@modules/common/components/ui"

import FilterSection from "../filter-section"

export type OptionFilterValue = {
  id: string
  label: string
}

export type OptionFilterGroup = {
  id: string
  title: string
  values: OptionFilterValue[]
}

type OptionsPickerProps = {
  optionGroups: OptionFilterGroup[]
  selectedValueIds: string[]
  setOptionValueIds: (valueIds: string[]) => void
}

const OptionsPicker = ({
  optionGroups,
  selectedValueIds,
  setOptionValueIds,
}: OptionsPickerProps) => {
  if (!optionGroups.length) {
    return null
  }

  return (
    <>
      {optionGroups.map((group) => {
        const selectedCount = group.values.filter((value) =>
          selectedValueIds.includes(value.id)
        ).length

        const toggleValue = (valueId: string) => {
          const isSelected = selectedValueIds.includes(valueId)
          const nextSelections = isSelected
            ? selectedValueIds.filter((id) => id !== valueId)
            : [...selectedValueIds, valueId]

          setOptionValueIds(Array.from(new Set(nextSelections)))
        }

        return (
          <FilterSection
            key={group.id}
            title={group.title}
            badge={
              selectedCount > 0 ? (
                <span className="text-red-500">({selectedCount})</span>
              ) : undefined
            }
          >
            <div className="grid grid-cols-4 gap-2">
              {group.values.map((value) => {
                const isSelected = selectedValueIds.includes(value.id)
                const swatch = getColorSwatch(value.label)

                if (swatch) {
                  return (
                    <button
                      key={value.id}
                      type="button"
                      onClick={() => toggleValue(value.id)}
                      title={value.label}
                      aria-pressed={isSelected}
                      className={clx(
                        "mx-auto h-9 w-9 rounded-full border-2 transition-colors",
                        isSelected ? "border-red-500" : "border-transparent"
                      )}
                    >
                      <span
                        className="block h-full w-full rounded-full border border-paper-200"
                        style={{ background: swatch }}
                      />
                    </button>
                  )
                }

                return (
                  <button
                    key={value.id}
                    type="button"
                    onClick={() => toggleValue(value.id)}
                    aria-pressed={isSelected}
                    className={clx(
                      "flex h-10 items-center justify-center rounded-base border px-2 text-sm font-medium transition-colors",
                      isSelected
                        ? "border-red-500 bg-red-500 text-white"
                        : "border-paper-200 text-ink-500 hover:border-ink hover:text-ink"
                    )}
                  >
                    {value.label}
                  </button>
                )
              })}
            </div>
          </FilterSection>
        )
      })}
    </>
  )
}

export default OptionsPicker
