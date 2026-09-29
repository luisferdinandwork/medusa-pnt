"use client"

import { addToCart } from "@lib/data/cart"
import { useIntersection } from "@lib/hooks/use-in-view"
import { useShopperLocation } from "@lib/hooks/use-shopper-location"
import {
  cartQuantityKey,
  defaultLocation,
  EMPTY_OMNICHANNEL,
  hasUnits,
  locationStockMessage,
  pickLocation,
  pickupLocations,
  recommendLocation,
  unitsAt,
  type FulfillmentMode,
  type OmnichannelData,
  type StockLocationOption,
} from "@lib/util/omnichannel"
import { purchaseLimit, remainingToAdd } from "@lib/util/stock"
import { HttpTypes } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import Divider from "@modules/common/components/divider"
import OptionSelect from "@modules/products/components/product-actions/option-select"
import StockLocationPicker from "@modules/products/components/stock-location-picker"
import { isEqual } from "lodash"
import { useParams, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import ProductPrice from "../product-price"
import MobileActions from "./mobile-actions"
import { useRouter } from "next/navigation"

type ProductActionsProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  disabled?: boolean
  /** Ship-from locations and the live stock of each variant at each. */
  omnichannel?: OmnichannelData
  /** Units already in the cart, keyed by `cartQuantityKey(variant, location)`. */
  cartQuantities?: Record<string, number>
  /** How the current bag is received, and how many lines it holds. */
  cartMode?: { mode: FulfillmentMode | null; pickupLocationId?: string; count: number }
}

const optionsAsKeymap = (
  variantOptions: HttpTypes.StoreProductVariant["options"]
) => {
  return variantOptions?.reduce((acc: Record<string, string>, varopt) => {
    if (varopt.option_id) acc[varopt.option_id] = varopt.value
    return acc
  }, {})
}

export default function ProductActions({
  product,
  disabled,
  omnichannel = EMPTY_OMNICHANNEL,
  cartQuantities = {},
  cartMode,
}: ProductActionsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [options, setOptions] = useState<Record<string, string | undefined>>({})
  const [isAdding, setIsAdding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const countryCode = useParams().countryCode as string

  const { locations, availability } = omnichannel
  const hasLocations = locations.length > 0
  const stores = useMemo(() => pickupLocations(locations), [locations])

  // Delivered from any location, or collected at a store. Starts on the
  // bag's current mode so adding more doesn't change how the bag is received.
  const [mode, setMode] = useState<FulfillmentMode>(
    cartMode?.mode === "pickup" && stores.length ? "pickup" : "delivery"
  )
  const modeLocations = mode === "pickup" ? stores : locations
  const cartStore =
    cartMode?.mode === "pickup"
      ? stores.find((store) => store.id === cartMode.pickupLocationId)
      : undefined

  // Ask for the shopper's position as soon as the page opens, so the nearest
  // store with stock can be suggested before anything goes into the bag.
  const shopper = useShopperLocation({ askOnMount: hasLocations })
  const [locationId, setLocationId] = useState<string | undefined>(() =>
    mode === "pickup" ? (cartStore ?? stores[0])?.id : defaultLocation(locations)?.id
  )
  const [pickedByShopper, setPickedByShopper] = useState(false)
  const [switchedFrom, setSwitchedFrom] = useState<StockLocationOption | null>(null)

  // If there is only 1 variant, preselect the options
  useEffect(() => {
    if (product.variants?.length === 1) {
      const variantOptions = optionsAsKeymap(product.variants[0].options)
      setOptions(variantOptions ?? {})
    }
  }, [product.variants])

  const selectedVariant = useMemo(() => {
    if (!product.variants || product.variants.length === 0) {
      return
    }

    return product.variants.find((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  // update the options when a variant is selected
  const setOptionValue = (optionId: string, value: string) => {
    setError(null)
    setOptions((prev) => ({
      ...prev,
      [optionId]: value,
    }))
  }

  //check if the selected options produce a valid variant
  const isValidVariant = useMemo(() => {
    return product.variants?.some((v) => {
      const variantOptions = optionsAsKeymap(v.options)
      return isEqual(variantOptions, options)
    })
  }, [product.variants, options])

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    const value = isValidVariant ? selectedVariant?.id : null

    if (params.get("v_id") === value) {
      return
    }

    if (value) {
      params.set("v_id", value)
    } else {
      params.delete("v_id")
    }

    router.replace(pathname + "?" + params.toString())
  }, [selectedVariant, isValidVariant])

  const variantId = selectedVariant?.id

  // Units of this size the chosen location would have to hold besides the one
  // being added. Picking up at a store the bag isn't at yet moves every unit
  // of the size there, so all of them count.
  const inCartAt = (id: string) => {
    if (!variantId) {
      return 0
    }
    if (mode === "pickup" && cartStore?.id !== id) {
      return Object.entries(cartQuantities)
        .filter(([key]) => key.startsWith(`${variantId}:`))
        .reduce((sum, [, units]) => sum + units, 0)
    }
    return cartQuantities[cartQuantityKey(variantId, id)] ?? 0
  }

  const inCartByLocation = useMemo(
    () =>
      Object.fromEntries(
        modeLocations.map((location) => [location.id, inCartAt(location.id)])
      ),
    [modeLocations, variantId, cartQuantities, mode]
  )

  // A location can ship when it has one more unit than the bag already holds
  // from it. Without a size chosen yet, every location is open.
  const canShip = (id: string) =>
    !variantId || hasUnits(unitsAt(availability, variantId, id), inCartAt(id) + 1)

  // Keep the selection on a location that can ship the chosen size: the
  // default (DM) unless the shopper picked another one, falling back to the
  // nearest location with stock when the current one has none.
  useEffect(() => {
    if (!modeLocations.length) {
      return
    }
    const current = modeLocations.find((location) => location.id === locationId)
    if (current && canShip(current.id) && (pickedByShopper || !variantId)) {
      return
    }
    // Pickup prefers the store the bag is already collected at.
    const preferred = pickedByShopper
      ? current
      : mode === "pickup"
      ? cartStore
      : defaultLocation(locations)
    const next =
      preferred && canShip(preferred.id)
        ? preferred
        : pickLocation(modeLocations, canShip, shopper.coords)
    if (!next) {
      return
    }
    setSwitchedFrom(
      preferred && preferred.id !== next.id && !canShip(preferred.id) ? preferred : null
    )
    setLocationId(next.id)
  }, [variantId, availability, cartQuantities, shopper.coords, mode, modeLocations.length])

  const recommendation = useMemo(
    () =>
      variantId
        ? recommendLocation(modeLocations, canShip, locationId, shopper.coords)
        : null,
    [modeLocations, variantId, locationId, shopper.coords, availability, cartQuantities, mode]
  )

  const changeMode = (next: FulfillmentMode) => {
    if (next === mode) {
      return
    }
    setError(null)
    setSwitchedFrom(null)
    setPickedByShopper(false)
    setMode(next)
  }

  const selectLocation = (id: string) => {
    setError(null)
    setSwitchedFrom(null)
    setPickedByShopper(true)
    setLocationId(id)
  }

  const selectedLocation = modeLocations.find((location) => location.id === locationId)

  // Units of the selected size at the selected location: the purchase limit
  // (null = no limit), how many are already in the bag from there, and how
  // many more can be added. Without omnichannel data, the variant's total.
  const { limit, inCart, remaining } = useMemo(() => {
    if (!selectedVariant) {
      return { limit: null, inCart: 0, remaining: 0 }
    }
    if (hasLocations && selectedLocation) {
      const limit = unitsAt(availability, selectedVariant.id, selectedLocation.id)
      const inCart = inCartAt(selectedLocation.id)
      return { limit, inCart, remaining: remainingToAdd(limit, inCart) }
    }
    if (hasLocations) {
      return { limit: 0, inCart: 0, remaining: 0 }
    }
    const limit = purchaseLimit(selectedVariant)
    return { limit, inCart: 0, remaining: remainingToAdd(limit, 0) }
  }, [selectedVariant, availability, selectedLocation, cartQuantities, hasLocations, mode])

  const anyLocationCanShip =
    !hasLocations || modeLocations.some((location) => canShip(location.id))
  const soldOut = hasLocations
    ? !!variantId &&
      modeLocations.every((location) => unitsAt(availability, variantId, location.id) === 0)
    : limit === 0
  const allInCart = !soldOut && !anyLocationCanShip
  const inStock = !!selectedVariant && remaining > 0

  const actionsRef = useRef<HTMLDivElement>(null)

  const inView = useIntersection(actionsRef, "0px")

  // add the selected variant to the cart; resolves to whether it was added
  const handleAddToCart = async () => {
    if (!selectedVariant?.id) return false

    setError(null)
    setIsAdding(true)

    try {
      const result = await addToCart({
        variantId: selectedVariant.id,
        quantity: 1,
        countryCode,
        locationId: hasLocations ? selectedLocation?.id : undefined,
        fulfillment: mode,
      })
      if (!result.success) {
        setError(result.error)
        // The stock or the bag changed elsewhere; reload them so the button
        // and stock note match what the backend just said.
        router.refresh()
      }
      return result.success
    } catch {
      setError("Tas belanja gagal diperbarui. Coba lagi sebentar lagi.")
      return false
    } finally {
      setIsAdding(false)
    }
  }

  const buttonLabel = !selectedVariant
    ? "Pilih Ukuran"
    : soldOut && mode === "pickup"
    ? "Tidak Ada di Toko"
    : !isValidVariant || soldOut
    ? "Stok Habis"
    : allInCart
    ? "Sudah Maksimal di Tas"
    : "Masukkan Tas"

  const stockNote = (() => {
    if (!selectedVariant || limit === null || soldOut) {
      return null
    }
    if (allInCart && selectedLocation) {
      return locationStockMessage(selectedLocation, limit, inCart)
    }
    // With locations, the picker already shows "Sisa N" for the chosen one.
    if (!hasLocations && limit > 0 && limit <= 5) {
      const where = selectedLocation ? ` di ${selectedLocation.code}` : ""
      return `Ukuran ini tinggal ${limit} pasang${where}.${
        inCart > 0 ? ` ${inCart} sudah ada di tas kamu.` : ""
      }`
    }
    return null
  })()

  // What adding this item does to the rest of the bag, said before it happens.
  const notice = (() => {
    if (!cartMode?.count) {
      return null
    }
    if (mode === "pickup" && selectedLocation && cartStore?.id !== selectedLocation.id) {
      return `Semua produk di tas (${cartMode.count}) akan ikut diambil di ${selectedLocation.name}.`
    }
    if (mode === "delivery" && cartMode.mode === "pickup") {
      return "Produk di tas yang diambil di toko akan diubah menjadi dikirim."
    }
    return null
  })()

  const picker = hasLocations ? (
    <StockLocationPicker
      omnichannel={{ locations: modeLocations, availability }}
      mode={mode}
      onModeChange={changeMode}
      canPickup={stores.length > 0}
      notice={notice}
      variantId={variantId}
      selectedId={locationId}
      onSelect={selectLocation}
      inCartByLocation={inCartByLocation}
      shopper={shopper}
      recommendation={recommendation}
      switchedFrom={switchedFrom}
      disabled={!!disabled || isAdding}
    />
  ) : null

  return (
    <>
      <div className="flex flex-col gap-y-5">
        <ProductPrice product={product} variant={selectedVariant} />

        {(product.variants?.length ?? 0) > 1 &&
          (product.options || []).map((option) => (
            <OptionSelect
              key={option.id}
              option={option}
              current={options[option.id]}
              updateOption={setOptionValue}
              title={option.title ?? ""}
              data-testid="product-options"
              disabled={!!disabled || isAdding}
            />
          ))}

        {picker}

        {/* The mobile bar appears once this block scrolls out of view. */}
        <div className="flex flex-col gap-y-2" ref={actionsRef}>
          {stockNote && (
            <p className="text-small-regular text-red-500" data-testid="stock-message">
              {stockNote}
            </p>
          )}

          <Button
            onClick={handleAddToCart}
            disabled={
              !inStock ||
              !selectedVariant ||
              !!disabled ||
              isAdding ||
              !isValidVariant
            }
            variant="primary"
            className="w-full h-12"
            isLoading={isAdding}
            data-testid="add-product-button"
          >
            {buttonLabel}
          </Button>
          {error && (
            <p
              className="text-small-regular text-red-500"
              role="alert"
              data-testid="add-to-cart-error"
            >
              {error}
            </p>
          )}
        </div>
        <Divider />
        <MobileActions
          product={product}
          variant={selectedVariant}
          options={options}
          updateOptions={setOptionValue}
          inStock={inStock}
          buttonLabel={buttonLabel}
          error={error}
          handleAddToCart={handleAddToCart}
          isAdding={isAdding}
          show={!inView}
          optionsDisabled={!!disabled || isAdding}
          locationPicker={picker}
          locationCode={
            selectedLocation
              ? mode === "pickup"
                ? `Ambil di ${selectedLocation.code}`
                : selectedLocation.code
              : undefined
          }
        />
      </div>
    </>
  )
}
