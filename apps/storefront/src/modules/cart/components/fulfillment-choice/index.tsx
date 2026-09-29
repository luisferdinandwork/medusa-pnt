"use client"

import { setCartFulfillment } from "@lib/data/cart"
import {
  cartFulfillment,
  hasUnits,
  pickupLocations,
  unitsAt,
  type FulfillmentMode,
  type OmnichannelData,
  type StockLocationOption,
} from "@lib/util/omnichannel"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"
import LocationKindIcon from "@modules/common/icons/location-kind"
import Spinner from "@modules/common/icons/spinner"
import { useState } from "react"

/**
 * "How do you want to receive it": the whole bag delivered, or collected at
 * one store. A cart gets a single shipping method, so the choice applies to
 * every item; a store is only offered when it has stock for all of them.
 */
export default function FulfillmentChoice({
  cart,
  omnichannel,
}: {
  cart: HttpTypes.StoreCart
  omnichannel?: OmnichannelData
}) {
  const [pending, setPending] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const locations = omnichannel?.locations ?? []
  const availability = omnichannel?.availability ?? {}
  const stores = pickupLocations(locations)
  const items = cart.items ?? []

  if (!stores.length || !items.length) {
    return null
  }

  const current = cartFulfillment(items, locations)

  // Units per variant across the whole bag: a pickup store has to hold them all.
  const needed = new Map<string, number>()
  for (const item of items) {
    if (item.variant_id) {
      needed.set(item.variant_id, (needed.get(item.variant_id) ?? 0) + item.quantity)
    }
  }
  const shortAt = (store: StockLocationOption) =>
    Array.from(needed.entries()).filter(
      ([variantId, units]) => !hasUnits(unitsAt(availability, variantId, store.id), units)
    ).length

  const apply = async (mode: FulfillmentMode, locationId?: string) => {
    setError(null)
    setPending(locationId ?? mode)
    try {
      const result = await setCartFulfillment({ mode, locationId })
      if (!result.success) {
        setError(result.error)
      }
    } catch {
      setError("Cara terima gagal diubah. Coba lagi sebentar lagi.")
    } finally {
      setPending(null)
    }
  }

  const choosePickup = () => {
    const store = stores.find((entry) => shortAt(entry) === 0)
    if (!store) {
      setError("Belum ada toko yang punya semua produk di tas kamu. Pilih dikirim, atau kurangi isi tas.")
      return
    }
    apply("pickup", store.id)
  }

  const mode = current.mode ?? "delivery"

  return (
    <div className="flex flex-col gap-y-3" data-testid="fulfillment-choice">
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">
        Cara terima
      </span>
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-rounded bg-paper-100 p-1">
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
            disabled={!!pending}
            onClick={() =>
              value === mode ? undefined : value === "pickup" ? choosePickup() : apply("delivery")
            }
            data-testid={`cart-fulfillment-${value}`}
            className={clx(
              "flex items-center justify-center gap-x-2 rounded-base px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              mode === value ? "bg-white text-ink shadow-sm" : "text-ink-500 hover:text-ink"
            )}
          >
            {pending === value && <Spinner size="12" />}
            {label}
          </button>
        ))}
      </div>

      {mode === "pickup" && (
        <div
          role="radiogroup"
          aria-label="Toko pengambilan"
          className="flex flex-col divide-y divide-paper-200 overflow-hidden rounded-rounded border border-paper-200 bg-white"
        >
          {stores.map((store) => {
            const short = shortAt(store)
            const isCurrent = current.pickupLocationId === store.id
            return (
              <button
                key={store.id}
                type="button"
                role="radio"
                aria-checked={isCurrent}
                disabled={!!pending || isCurrent || short > 0}
                onClick={() => apply("pickup", store.id)}
                data-testid="pickup-store-option"
                data-location-code={store.code}
                className={clx(
                  "flex items-start gap-x-3 px-3 py-2.5 text-left transition-colors",
                  isCurrent ? "bg-paper-100" : "hover:bg-paper-100/60",
                  short > 0 && !isCurrent && "cursor-not-allowed opacity-50"
                )}
              >
                <span className="mt-0.5">
                  <LocationKindIcon kind="store" />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-small-regular font-semibold text-ink">
                    {store.name}
                  </span>
                  <span className="text-xs text-ink-500">
                    {[store.address?.address_1, store.address?.city].filter(Boolean).join(", ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs font-semibold">
                  {pending === store.id ? (
                    <Spinner size="12" />
                  ) : isCurrent ? (
                    <span className="text-ink-500">Dipilih</span>
                  ) : short > 0 ? (
                    <span className="text-ink-500/70">{short} produk kurang</span>
                  ) : (
                    <span className="text-emerald-600">Semua ada</span>
                  )}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {mode === "pickup" && (
        <p className="text-xs text-ink-500">
          Gratis. Pilih opsi ambil di toko saat checkout, lalu tunjukkan email
          pesanan di kasir.
        </p>
      )}

      {error && (
        <p className="text-xs text-red-500" role="alert" data-testid="fulfillment-error">
          {error}
        </p>
      )}
    </div>
  )
}
