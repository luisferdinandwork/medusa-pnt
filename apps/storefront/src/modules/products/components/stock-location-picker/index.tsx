"use client"

import type { ShopperLocationStatus } from "@lib/hooks/use-shopper-location"
import {
  distanceKm,
  formatDistance,
  hasUnits,
  locationKindLabel,
  unitsAt,
  type Coordinates,
  type FulfillmentMode,
  type OmnichannelData,
  type StockLocationOption,
} from "@lib/util/omnichannel"
import { MapPin } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import LocationKindIcon from "@modules/common/icons/location-kind"
import { useState } from "react"

type StockLocationPickerProps = {
  omnichannel: OmnichannelData
  variantId: string | undefined
  selectedId: string | undefined
  onSelect: (locationId: string) => void
  /** Units of the selected variant already in the bag, per location id. */
  inCartByLocation: Record<string, number>
  shopper: {
    status: ShopperLocationStatus
    coords: Coordinates | null
    request: () => void
  }
  recommendation: { location: StockLocationOption; km: number } | null
  /** Set when the preferred location ran out and another one was preselected. */
  switchedFrom?: StockLocationOption | null
  disabled?: boolean
  /** Delivered (ship from) or collected at a store (pickup). */
  mode: FulfillmentMode
  onModeChange: (mode: FulfillmentMode) => void
  /** Whether any store offers pickup; hides the switch otherwise. */
  canPickup: boolean
  /** What adding this item does to the rest of the bag, when it changes it. */
  notice?: string | null
}

const StockLabel = ({
  units,
  inCart,
  hasVariant,
}: {
  units: number | null
  inCart: number
  hasVariant: boolean
}) => {
  if (!hasVariant) {
    return <span className="text-ink-500/60">Pilih ukuran</span>
  }
  if (units === null) {
    return <span className="text-emerald-600">Tersedia</span>
  }
  const left = Math.max(0, units - inCart)
  if (units <= 0) {
    return <span className="text-ink-500/60">Habis</span>
  }
  if (left <= 0) {
    return <span className="text-red-500">Semua di tas</span>
  }
  return (
    <span className={left <= 3 ? "text-red-500" : "text-emerald-600"}>
      {left <= 3 ? `Sisa ${left}` : `Stok ${left}`}
    </span>
  )
}

/**
 * Compact "ship from" choice: one line for the chosen location with its stock
 * for the selected size, expanding into the full list on "Ganti". A slim hint
 * suggests a closer location when the shopper's position is known.
 */
export default function StockLocationPicker({
  omnichannel,
  variantId,
  selectedId,
  onSelect,
  inCartByLocation,
  shopper,
  recommendation,
  switchedFrom,
  disabled,
  mode,
  onModeChange,
  canPickup,
  notice,
}: StockLocationPickerProps) {
  const [open, setOpen] = useState(false)
  const { locations, availability } = omnichannel
  const pickup = mode === "pickup"

  const modeSwitch = canPickup && (
    <div
      role="tablist"
      aria-label="Cara terima"
      className="grid grid-cols-2 gap-1 rounded-rounded bg-paper-100 p-1"
      data-testid="fulfillment-mode"
    >
      {(
        [
          ["delivery", "Dikirim"],
          ["pickup", "Ambil di toko"],
        ] as const
      ).map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={mode === value}
          disabled={disabled}
          onClick={() => {
            setOpen(false)
            onModeChange(value)
          }}
          data-testid={`fulfillment-mode-${value}`}
          className={clx(
            "rounded-base px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
            mode === value ? "bg-white text-ink shadow-sm" : "text-ink-500 hover:text-ink"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  if (!locations.length) {
    return modeSwitch ? (
      <div className="flex flex-col gap-y-2">
        {modeSwitch}
        <p className="text-xs text-ink-500">Belum ada toko yang melayani ambil di toko.</p>
      </div>
    ) : null
  }

  const selected = locations.find((location) => location.id === selectedId) ?? locations[0]

  const detail = (location: StockLocationOption) => {
    const km = shopper.coords ? distanceKm(shopper.coords, location) : null
    return [locationKindLabel(location), location.code, km !== null ? formatDistance(km) : null]
      .filter(Boolean)
      .join(" · ")
  }

  const units = (location: StockLocationOption) =>
    variantId ? unitsAt(availability, variantId, location.id) : null

  const choose = (id: string) => {
    onSelect(id)
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-y-2" data-testid="stock-location-picker">
      {modeSwitch}
      <div className="flex items-center justify-between gap-x-4">
        <span className="text-sm">{pickup ? "Ambil di" : "Dikirim dari"}</span>
        {shopper.status === "granted" ? (
          <span className="flex items-center gap-x-1 text-xs text-ink-500">
            <MapPin className="h-3.5 w-3.5" />
            Lokasimu aktif
          </span>
        ) : shopper.status === "locating" ? (
          <span className="text-xs text-ink-500">Mencari lokasimu...</span>
        ) : (
          <button
            type="button"
            onClick={shopper.request}
            className="flex items-center gap-x-1 text-xs font-semibold text-ink hover:text-red-500 transition-colors"
            data-testid="use-my-location"
          >
            <MapPin className="h-3.5 w-3.5" />
            Gunakan lokasiku
          </button>
        )}
      </div>

      {!open ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setOpen(true)}
          aria-expanded={false}
          className="flex w-full items-center gap-x-3 rounded-rounded border border-paper-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-ink-500 disabled:opacity-60"
          data-testid="stock-location-selected"
        >
          <LocationKindIcon kind={selected.kind} />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-small-regular font-semibold text-ink">
              {selected.name}
            </span>
            <span className="truncate text-xs text-ink-500">
              {pickup && selected.address?.address_1
                ? `${selected.address.address_1} · Gratis`
                : detail(selected)}
            </span>
          </span>
          <span className="shrink-0 text-xs font-semibold">
            <StockLabel
              units={units(selected)}
              inCart={inCartByLocation[selected.id] ?? 0}
              hasVariant={!!variantId}
            />
          </span>
          {locations.length > 1 && (
            <span className="shrink-0 text-xs font-semibold text-ink underline underline-offset-2">
              Ganti
            </span>
          )}
        </button>
      ) : (
        <div
          role="radiogroup"
          aria-label="Lokasi pengiriman"
          className="overflow-hidden rounded-rounded border border-ink-500 bg-white"
        >
          <div className="flex items-center justify-between border-b border-paper-200 px-3 py-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-500">
              {pickup ? "Pilih toko" : "Pilih lokasi"}
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-semibold text-ink underline underline-offset-2"
            >
              Tutup
            </button>
          </div>
          {locations.map((location) => {
            const inCart = inCartByLocation[location.id] ?? 0
            const canShip = !variantId || hasUnits(units(location), inCart + 1)
            const isSelected = location.id === selected.id
            return (
              <button
                key={location.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={disabled || !canShip}
                onClick={() => choose(location.id)}
                data-testid="stock-location-option"
                data-location-code={location.code}
                className={clx(
                  "flex w-full items-center gap-x-3 px-3 py-2 text-left transition-colors",
                  isSelected ? "bg-paper-100" : "hover:bg-paper-100/60",
                  !canShip && "cursor-not-allowed opacity-50"
                )}
              >
                <span
                  aria-hidden
                  className={clx(
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border",
                    isSelected ? "border-red-500" : "border-ink-500/40"
                  )}
                >
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-red-500" />}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-small-regular font-semibold text-ink">
                    {location.name}
                  </span>
                  <span className="truncate text-xs text-ink-500">
                    {detail(location)}
                    {location.is_default && " · Utama"}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold">
                  <StockLabel units={units(location)} inCart={inCart} hasVariant={!!variantId} />
                </span>
              </button>
            )
          })}
        </div>
      )}

      {recommendation && (
        <p className="text-xs text-ink-500" data-testid="location-recommendation">
          Lebih dekat denganmu:{" "}
          <span className="font-semibold text-ink">{recommendation.location.name}</span>{" "}
          · {formatDistance(recommendation.km)}{" "}
          <button
            type="button"
            disabled={disabled}
            onClick={() => choose(recommendation.location.id)}
            className="font-semibold text-red-500 underline underline-offset-2 hover:text-red-600"
          >
            Kirim dari sini
          </button>
        </p>
      )}

      {switchedFrom && switchedFrom.id !== selected.id && (
        <p className="text-xs text-ink-500" data-testid="location-switched">
          Ukuran ini habis di {switchedFrom.code}, jadi dikirim dari {selected.code}.
        </p>
      )}

      {notice && (
        <p className="text-xs text-ink-500" data-testid="fulfillment-notice">
          {notice}
        </p>
      )}

      {shopper.status === "denied" && (
        <p className="text-xs text-ink-500">
          Akses lokasi ditolak. Pilih lokasi pengiriman secara manual.
        </p>
      )}
    </div>
  )
}
