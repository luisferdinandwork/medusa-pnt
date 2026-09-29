import { Dialog, Transition } from "@headlessui/react"
import { Button, clx } from "@modules/common/components/ui"
import React, { Fragment, useMemo } from "react"

import useToggleState from "@lib/hooks/use-toggle-state"
import { ChevronUpDown, XMark } from "@medusajs/icons"
import Image from "next/image"

import { getProductPrice } from "@lib/util/get-product-price"
import OptionSelect from "./option-select"
import { HttpTypes } from "@medusajs/types"
import { isSimpleProduct } from "@lib/util/product"

type MobileActionsProps = {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
  options: Record<string, string | undefined>
  updateOptions: (title: string, value: string) => void
  inStock?: boolean
  /** Same label as the main button, so both explain why adding is blocked. */
  buttonLabel: string
  error?: string | null
  /** Resolves to true when the item was added. */
  handleAddToCart: () => Promise<boolean>
  isAdding?: boolean
  show: boolean
  optionsDisabled: boolean
  /** The ship-from location picker, shown in the sheet. */
  locationPicker?: React.ReactNode
  /** Short code of the chosen ship-from location, e.g. "DM". */
  locationCode?: string
}

/**
 * The bar pinned to the bottom of the screen on phones while the main add
 * button is scrolled away: price, the chosen size and location, and the add
 * button. Tapping it opens a sheet to pick the size and the location.
 */
const MobileActions: React.FC<MobileActionsProps> = ({
  product,
  variant,
  options,
  updateOptions,
  inStock,
  buttonLabel,
  error,
  handleAddToCart,
  isAdding,
  show,
  optionsDisabled,
  locationPicker,
  locationCode,
}) => {
  const { state, open, close } = useToggleState()

  const price = getProductPrice({
    product: product,
    variantId: variant?.id,
  })

  const selectedPrice = useMemo(() => {
    if (!price) {
      return null
    }
    const { variantPrice, cheapestPrice } = price

    return variantPrice || cheapestPrice || null
  }, [price])

  const isSimple = isSimpleProduct(product)
  const size = Object.values(options).filter(Boolean).join(" / ")
  const summary = variant
    ? [isSimple ? null : size, locationCode].filter(Boolean).join(" · ")
    : "Pilih ukuran"

  const onPrimary = () => {
    // Without a size there's nothing to add yet: open the picker instead of
    // leaving the button disabled.
    if (!variant && !isSimple) {
      open()
      return
    }
    handleAddToCart()
  }

  const priceLabel = selectedPrice && (
    <span className="flex items-baseline gap-x-2">
      <span
        className={clx("font-display text-lg leading-none", {
          "text-red-500": selectedPrice.price_type === "sale",
        })}
      >
        {selectedPrice.calculated_price}
      </span>
      {selectedPrice.price_type === "sale" && (
        <span className="text-xs text-ink-500/60 line-through">
          {selectedPrice.original_price}
        </span>
      )}
    </span>
  )

  return (
    <>
      <div
        className={clx("small:hidden inset-x-0 bottom-0 fixed z-50", {
          "pointer-events-none": !show,
        })}
      >
        <Transition
          as={Fragment}
          show={show}
          enter="ease-out duration-200"
          enterFrom="opacity-0 translate-y-full"
          enterTo="opacity-100 translate-y-0"
          leave="ease-in duration-150"
          leaveFrom="opacity-100 translate-y-0"
          leaveTo="opacity-0 translate-y-full"
        >
          <div
            className="border-t border-paper-200 bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur"
            data-testid="mobile-actions"
          >
            <div className="flex items-center gap-x-3">
              <button
                type="button"
                onClick={open}
                className="flex min-w-0 flex-1 items-center gap-x-3 text-left"
                data-testid="mobile-actions-button"
              >
                {product.thumbnail && (
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-rounded bg-ui-bg-subtle">
                    <Image src={product.thumbnail} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                )}
                <span className="flex min-w-0 flex-col gap-y-1">
                  {priceLabel}
                  <span className="flex items-center gap-x-1 truncate text-xs text-ink-500">
                    <span className="truncate">{summary}</span>
                    <ChevronUpDown className="h-3.5 w-3.5 shrink-0" />
                  </span>
                </span>
              </button>
              <Button
                onClick={onPrimary}
                disabled={!!variant && !inStock}
                className="h-11 shrink-0 px-5"
                isLoading={isAdding}
                data-testid="mobile-cart-button"
              >
                {!variant && !isSimple ? "Pilih Ukuran" : buttonLabel}
              </Button>
            </div>
            {error && (
              <p className="mt-2 text-xs text-red-500" role="alert">
                {error}
              </p>
            )}
          </div>
        </Transition>
      </div>

      <Transition appear show={state} as={Fragment}>
        <Dialog as="div" className="relative z-[75] small:hidden" onClose={close}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-ink/50" />
          </Transition.Child>

          <div className="fixed inset-x-0 bottom-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="translate-y-full"
              enterTo="translate-y-0"
              leave="ease-in duration-150"
              leaveFrom="translate-y-0"
              leaveTo="translate-y-full"
            >
              <Dialog.Panel
                className="flex max-h-[85vh] w-full flex-col rounded-t-large bg-white text-left"
                data-testid="mobile-actions-modal"
              >
                <div className="flex items-start justify-between gap-x-4 border-b border-paper-200 px-5 py-4">
                  <div className="min-w-0">
                    <Dialog.Title className="truncate text-small-regular font-semibold text-ink">
                      {product.title}
                    </Dialog.Title>
                    <div className="mt-1">{priceLabel}</div>
                  </div>
                  <button
                    onClick={close}
                    aria-label="Tutup"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-paper-100 text-ink"
                    data-testid="close-modal-button"
                  >
                    <XMark />
                  </button>
                </div>

                <div className="flex flex-col gap-y-5 overflow-y-auto px-5 py-5">
                  {(product.variants?.length ?? 0) > 1 &&
                    (product.options || []).map((option) => (
                      <OptionSelect
                        key={option.id}
                        option={option}
                        current={options[option.id]}
                        updateOption={updateOptions}
                        title={option.title ?? ""}
                        disabled={optionsDisabled}
                      />
                    ))}
                  {locationPicker}
                </div>

                <div className="border-t border-paper-200 px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
                  <Button
                    onClick={async () => {
                      if (await handleAddToCart()) {
                        close()
                      }
                    }}
                    disabled={!inStock || !variant}
                    className="h-12 w-full"
                    isLoading={isAdding}
                    data-testid="mobile-sheet-cart-button"
                  >
                    {buttonLabel}
                  </Button>
                  {error && (
                    <p className="mt-2 text-xs text-red-500" role="alert">
                      {error}
                    </p>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition>
    </>
  )
}

export default MobileActions
