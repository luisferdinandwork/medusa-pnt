"use client"

import { ChevronDownMini } from "@medusajs/icons"
import { useState } from "react"

import { clx } from "@modules/common/components/ui"

type FilterSectionProps = {
  title: string
  defaultOpen?: boolean
  badge?: React.ReactNode
  children: React.ReactNode
}

const FilterSection = ({
  title,
  defaultOpen = true,
  badge,
  children,
}: FilterSectionProps) => {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-paper-200 py-4 first:pt-0 last:border-b-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between"
        aria-expanded={open}
      >
        <span className="flex items-center gap-x-2 text-sm font-semibold uppercase tracking-wide text-ink">
          {title}
          {badge}
        </span>
        <ChevronDownMini
          className={clx(
            "text-ink-500 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && <div className="pt-4">{children}</div>}
    </div>
  )
}

export default FilterSection
