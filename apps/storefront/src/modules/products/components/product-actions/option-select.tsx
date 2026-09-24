import { HttpTypes } from "@medusajs/types"
import { getColorSwatch } from "@lib/util/color-swatch-map"
import { clx } from "@modules/common/components/ui"
import React from "react"

type OptionSelectProps = {
  option: HttpTypes.StoreProductOption
  current: string | undefined
  updateOption: (title: string, value: string) => void
  title: string
  disabled: boolean
  "data-testid"?: string
}

const OptionSelect: React.FC<OptionSelectProps> = ({
  option,
  current,
  updateOption,
  title,
  "data-testid": dataTestId,
  disabled,
}) => {
  const filteredOptions = (option.values ?? []).map((v) => v.value)
  const isColorOption = filteredOptions.some((v) => !!getColorSwatch(v))

  return (
    <div className="flex flex-col gap-y-3">
      <span className="text-sm">
        {isColorOption ? "Warna" : `Pilih ${title}`}
        {current && <span className="text-ink-500"> - {current}</span>}
      </span>
      <div
        className="flex flex-wrap gap-2"
        data-testid={dataTestId}
      >
        {filteredOptions.map((v) => {
          const swatch = getColorSwatch(v)

          if (swatch) {
            return (
              <button
                onClick={() => updateOption(option.id, v)}
                key={v}
                title={v}
                disabled={disabled}
                className={clx(
                  "h-10 w-10 rounded-full border-2 transition-colors duration-150",
                  v === current ? "border-red-500" : "border-transparent"
                )}
                data-testid="option-button"
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
              onClick={() => updateOption(option.id, v)}
              key={v}
              className={clx(
                "border-paper-200 bg-paper-100 border text-small-regular h-11 min-w-11 rounded-rounded px-3 flex items-center justify-center transition-colors duration-150",
                {
                  "border-red-500 text-red-500 bg-white": v === current,
                  "hover:border-ink-500": v !== current,
                }
              )}
              disabled={disabled}
              data-testid="option-button"
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default OptionSelect
