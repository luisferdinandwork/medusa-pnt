"use client"

import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react"
import { ChevronDownMini } from "@medusajs/icons"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Fragment } from "react"

import { clx } from "@modules/common/components/ui"

export type SortOptions =
  | "created_at"
  | "price_asc"
  | "price_desc"
  | "title_asc"
  | "title_desc"
  | "position"

const sortOptions: { value: SortOptions; label: string }[] = [
  { value: "created_at", label: "Terbaru" },
  { value: "price_desc", label: "Termahal" },
  { value: "price_asc", label: "Termurah" },
  { value: "title_asc", label: "Abjad A-Z" },
  { value: "title_desc", label: "Abjad Z-A" },
  { value: "position", label: "Posisi" },
]

type SortProductsProps = {
  sortBy?: SortOptions
  compact?: boolean
  "data-testid"?: string
}

const SortProducts = ({
  sortBy = "created_at",
  compact = false,
  "data-testid": dataTestId,
}: SortProductsProps) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const current = sortOptions.find((o) => o.value === sortBy) ?? sortOptions[0]

  const handleChange = (value: SortOptions) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("sortBy", value)
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Listbox value={sortBy} onChange={handleChange}>
      <div className="relative">
        <ListboxButton
          data-testid={dataTestId}
          className={clx(
            "flex items-center justify-between gap-x-2 h-11 rounded-full border border-paper-200 bg-white px-4 text-sm text-ink hover:border-ink transition-colors",
            compact ? "w-full" : "min-w-[200px]"
          )}
        >
          {!compact && (
            <span className="text-ink-500 text-xs uppercase tracking-wide">
              Urutkan
            </span>
          )}
          <span className="flex-1 text-left font-medium truncate">
            {current.label}
          </span>
          <ChevronDownMini className="text-ink-500 shrink-0" />
        </ListboxButton>
        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute right-0 z-20 mt-2 w-full min-w-[190px] overflow-hidden rounded-large border border-paper-200 bg-white shadow-elevation-flyout py-1">
            {sortOptions.map((option) => (
              <ListboxOption
                key={option.value}
                value={option.value}
                className={({ focus, selected }) =>
                  clx(
                    "cursor-pointer px-4 py-2.5 text-sm transition-colors",
                    focus && "bg-paper-100",
                    selected ? "text-red-500 font-semibold" : "text-ink"
                  )
                }
              >
                {option.label}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  )
}

export default SortProducts
