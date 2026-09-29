"use client"

import { Text } from "@modules/common/components/ui"
import { changeLineItemLocation, updateLineItem } from "@lib/data/cart"
import {
  EMPTY_OMNICHANNEL,
  hasUnits,
  LINE_ITEM_LOCATION_KEYS,
  lineFulfillment,
  lineLocationId,
  locationKindLabel,
  unitsAt,
  type OmnichannelData,
} from "@lib/util/omnichannel"
import { clx } from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import ErrorMessage from "@modules/checkout/components/error-message"
import DeleteButton from "@modules/common/components/delete-button"
import LineItemOptions from "@modules/common/components/line-item-options"
import LineItemPrice from "@modules/common/components/line-item-price"
import LineItemUnitPrice from "@modules/common/components/line-item-unit-price"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Spinner from "@modules/common/icons/spinner"
import Thumbnail from "@modules/products/components/thumbnail"
import { useState } from "react"

type ItemProps = {
  item: HttpTypes.StoreCartLineItem
  type?: "full" | "preview"
  currencyCode: string
  /** Ship-from locations and live stock; enables the "ship from" choice. */
  omnichannel?: OmnichannelData
  /** All lines of the cart, to count units of the same size per location. */
  cartItems?: HttpTypes.StoreCartLineItem[]
}

const MAX_QUANTITY = 10

const QuantityStepper = ({
  quantity,
  max,
  disabled,
  onChange,
}: {
  quantity: number
  max: number
  disabled?: boolean
  onChange: (quantity: number) => void
}) => {
  return (
    <div
      className="inline-flex items-center rounded-full border border-paper-200 bg-white"
      data-testid="product-select-button"
    >
      <button
        type="button"
        aria-label="Kurangi jumlah"
        disabled={disabled || quantity <= 1}
        onClick={() => onChange(quantity - 1)}
        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center txt-medium-plus tabular-nums" data-testid="product-quantity">
        {quantity}
      </span>
      <button
        type="button"
        aria-label="Tambah jumlah"
        disabled={disabled || quantity >= max}
        onClick={() => onChange(quantity + 1)}
        className="flex h-9 w-9 items-center justify-center text-ink transition-colors hover:text-red-500 disabled:pointer-events-none disabled:opacity-30"
      >
        +
      </button>
    </div>
  )
}

const Item = ({
  item,
  type = "full",
  currencyCode,
  omnichannel = EMPTY_OMNICHANNEL,
  cartItems = [],
}: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [choosingLocation, setChoosingLocation] = useState(false)

  const { locations, availability } = omnichannel
  const locationId = lineLocationId(item.metadata, locations)
  const location = locations.find((entry) => entry.id === locationId)
  // Pickup lines all share the bag's store; it is changed in the summary.
  const pickup = lineFulfillment(item.metadata) === "pickup"

  // Units of this size in the cart's other lines shipping from a location.
  const inOtherLinesAt = (id: string) =>
    cartItems
      .filter(
        (line) =>
          line.id !== item.id &&
          line.variant_id === item.variant_id &&
          lineLocationId(line.metadata, locations) === id
      )
      .reduce((sum, line) => sum + line.quantity, 0)

  // What this line may hold at its location: the stock there minus what other
  // lines already take from it. null = no limit (or no omnichannel data).
  const stockLimit = (() => {
    if (!location || !item.variant_id) {
      return null
    }
    const units = unitsAt(availability, item.variant_id, location.id)
    return units === null ? null : Math.max(0, units - inOtherLinesAt(location.id))
  })()

  const moveTo = async (id: string) => {
    setError(null)
    setUpdating(true)
    try {
      const result = await changeLineItemLocation({ lineId: item.id, locationId: id })
      if (!result.success) {
        setError(result.error)
      } else {
        setChoosingLocation(false)
      }
    } catch {
      setError("Lokasi pengiriman gagal diganti. Coba lagi sebentar lagi.")
    } finally {
      setUpdating(false)
    }
  }

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    try {
      const result = await updateLineItem({
        lineId: item.id,
        quantity,
      })
      if (!result.success) {
        setError(result.error)
      }
    } catch {
      setError("Tas belanja gagal diperbarui. Coba lagi sebentar lagi.")
    } finally {
      setUpdating(false)
    }
  }

  // The stepper stops at the stock; a line already above it (stock sold since
  // it was added) can still be lowered.
  const maxQuantity =
    stockLimit === null ? MAX_QUANTITY : Math.min(MAX_QUANTITY, stockLimit)
  const overStock = stockLimit !== null && item.quantity > stockLimit
  const where = location ? ` di ${location.code}` : ""
  const stockNote =
    stockLimit === null
      ? null
      : stockLimit === 0
      ? `Ukuran ini sudah habis${where}. Ganti lokasi pengiriman atau hapus dari tas.`
      : overStock
      ? `Stok${where} tinggal ${stockLimit}. Kurangi jumlahnya atau ganti lokasi pengiriman.`
      : item.quantity >= stockLimit
      ? `Stok${where} tersisa ${stockLimit}, semuanya sudah ada di tas kamu.`
      : null

  // The checkout summary and the cart dropdown have no stock data; they show
  // the location saved on the line when it was added.
  const savedLocationCode = item.metadata?.[LINE_ITEM_LOCATION_KEYS.code]

  if (type === "preview") {
    return (
      <div className="flex gap-x-4" data-testid="product-row">
        <LocalizedClientLink
          href={`/products/${item.product_handle}`}
          className="w-16 shrink-0"
        >
          <Thumbnail
            thumbnail={item.thumbnail}
            images={item.variant?.product?.images}
            size="square"
          />
        </LocalizedClientLink>
        <div className="flex flex-1 flex-col justify-center gap-y-0.5 min-w-0">
          <Text
            className="txt-medium-plus text-ink truncate"
            data-testid="product-title"
          >
            {item.product_title}
          </Text>
          <LineItemOptions variant={item.variant} data-testid="product-variant" />
          <span className="text-ui-fg-muted txt-small">
            {item.quantity}x{" "}
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </span>
          {typeof savedLocationCode === "string" && (
            <span className="text-ui-fg-muted txt-small" data-testid="product-ship-from">
              {pickup ? "Diambil di" : "Dikirim dari"} {savedLocationCode}
            </span>
          )}
        </div>
        <LineItemPrice item={item} style="tight" currencyCode={currencyCode} />
      </div>
    )
  }

  return (
    <div
      className="flex gap-x-4 small:gap-x-6 py-6 border-b border-paper-200"
      data-testid="product-row"
    >
      <LocalizedClientLink
        href={`/products/${item.product_handle}`}
        className="w-20 small:w-28 shrink-0"
      >
        <Thumbnail
          thumbnail={item.thumbnail}
          images={item.variant?.product?.images}
          size="square"
        />
      </LocalizedClientLink>

      <div className="flex flex-1 flex-col justify-between min-w-0 gap-y-3">
        <div className="flex items-start justify-between gap-x-4">
          <div className="min-w-0">
            <LocalizedClientLink href={`/products/${item.product_handle}`}>
              <Text
                className="txt-medium-plus text-ink font-semibold truncate"
                data-testid="product-title"
              >
                {item.product_title}
              </Text>
            </LocalizedClientLink>
            <LineItemOptions
              variant={item.variant}
              data-testid="product-variant"
            />
          </div>
          <div className="hidden small:block shrink-0 text-right">
            <LineItemUnitPrice
              item={item}
              style="tight"
              currencyCode={currencyCode}
            />
          </div>
        </div>

        <div className="flex items-end justify-between gap-x-4">
          <div className="flex items-center gap-x-3">
            <QuantityStepper
              quantity={item.quantity}
              max={maxQuantity}
              disabled={updating}
              onChange={changeQuantity}
            />
            {updating && <Spinner />}
          </div>

          <div className="flex items-center gap-x-4">
            <span className="font-semibold text-ink">
              <LineItemPrice
                item={item}
                style="tight"
                currencyCode={currencyCode}
              />
            </span>
            <DeleteButton
              id={item.id}
              data-testid="product-delete-button"
              aria-label="Hapus dari tas"
              className="text-ink-500 hover:text-red-500"
            />
          </div>
        </div>

        {location && (
          <div className="flex flex-col gap-y-2" data-testid="product-ship-from">
            <div className="flex flex-wrap items-center gap-x-2 text-xs text-ink-500">
              <span>
                {pickup ? "Diambil di" : "Dikirim dari"}{" "}
                <span className="font-semibold text-ink">{location.name}</span>{" "}
                · {locationKindLabel(location)} {location.code}
              </span>
              {!pickup && locations.length > 1 && (
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => setChoosingLocation((open) => !open)}
                  className="font-semibold text-ink underline underline-offset-2 hover:text-red-500 disabled:opacity-50"
                  aria-expanded={choosingLocation}
                  data-testid="change-ship-from"
                >
                  {choosingLocation ? "Tutup" : "Ganti"}
                </button>
              )}
            </div>

            {choosingLocation && (
              <div
                role="radiogroup"
                aria-label="Lokasi pengiriman"
                className="flex flex-col divide-y divide-paper-200 overflow-hidden rounded-rounded border border-paper-200 bg-white"
              >
                {locations.map((option) => {
                  const units = item.variant_id
                    ? unitsAt(availability, item.variant_id, option.id)
                    : null
                  const free =
                    units === null ? null : Math.max(0, units - inOtherLinesAt(option.id))
                  const canHold = hasUnits(free, item.quantity)
                  const isCurrent = option.id === location.id

                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={isCurrent}
                      disabled={updating || isCurrent || !canHold}
                      onClick={() => moveTo(option.id)}
                      data-testid="ship-from-option"
                      data-location-code={option.code}
                      className={clx(
                        "flex items-center justify-between gap-x-3 px-3 py-2.5 text-left transition-colors",
                        isCurrent ? "bg-paper-100" : "hover:bg-paper-100/60",
                        !canHold && !isCurrent && "cursor-not-allowed opacity-50"
                      )}
                    >
                      <span className="flex flex-col">
                        <span className="text-small-regular font-semibold text-ink">
                          {option.name}
                        </span>
                        <span className="text-xs text-ink-500">
                          {locationKindLabel(option)} {option.code}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold">
                        {isCurrent ? (
                          <span className="text-ink-500">Dipilih</span>
                        ) : free === null ? (
                          <span className="text-emerald-600">Tersedia</span>
                        ) : canHold ? (
                          <span className="text-emerald-600">Stok {free}</span>
                        ) : (
                          <span className="text-ink-500/70">
                            {free === 0 ? "Habis" : `Hanya ${free}`}
                          </span>
                        )}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
        {stockNote && !error && (
          <Text
            className={
              overStock || stockLimit === 0
                ? "txt-small text-red-500"
                : "txt-small text-ink-500"
            }
            data-testid="product-stock-note"
          >
            {stockNote}
          </Text>
        )}
        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </div>
  )
}

export default Item
