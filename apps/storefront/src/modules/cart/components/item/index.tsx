"use client"

import { Text } from "@modules/common/components/ui"
import { updateLineItem } from "@lib/data/cart"
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
}

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

const Item = ({ item, type = "full", currencyCode }: ItemProps) => {
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeQuantity = async (quantity: number) => {
    setError(null)
    setUpdating(true)

    await updateLineItem({
      lineId: item.id,
      quantity,
    })
      .catch((err) => {
        setError(err.message)
      })
      .finally(() => {
        setUpdating(false)
      })
  }

  const maxQuantity = 10

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

        <ErrorMessage error={error} data-testid="product-error-message" />
      </div>
    </div>
  )
}

export default Item
