"use client"

import { useEffect, useState } from "react"

import { Button } from "@modules/common/components/ui"

import FilterSection from "../filter-section"

type PriceFilterProps = {
  minPrice?: string
  maxPrice?: string
  onApply: (min?: string, max?: string) => void
}

const digitsOnly = (value: string) => value.replace(/[^\d]/g, "")

const PriceFilter = ({ minPrice, maxPrice, onApply }: PriceFilterProps) => {
  const [min, setMin] = useState(minPrice ?? "")
  const [max, setMax] = useState(maxPrice ?? "")

  useEffect(() => {
    setMin(minPrice ?? "")
  }, [minPrice])

  useEffect(() => {
    setMax(maxPrice ?? "")
  }, [maxPrice])

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onApply(min || undefined, max || undefined)
  }

  return (
    <FilterSection title="Harga">
      <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
        <div className="flex items-center gap-x-2">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Rp 0"
            value={min}
            onChange={(e) => setMin(digitsOnly(e.target.value))}
            className="h-10 w-full rounded-base border border-paper-200 px-3 text-sm text-ink placeholder:text-ink-500/40 focus:outline-none focus:border-ink"
            aria-label="Harga minimum"
          />
          <span className="shrink-0 text-ink-500">-</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Tanpa batas"
            value={max}
            onChange={(e) => setMax(digitsOnly(e.target.value))}
            className="h-10 w-full rounded-base border border-paper-200 px-3 text-sm text-ink placeholder:text-ink-500/40 focus:outline-none focus:border-ink"
            aria-label="Harga maksimum"
          />
        </div>
        <Button type="submit" size="small" className="w-full">
          Tampilkan
        </Button>
      </form>
    </FilterSection>
  )
}

export default PriceFilter
