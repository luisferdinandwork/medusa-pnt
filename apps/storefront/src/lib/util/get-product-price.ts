import { HttpTypes } from "@medusajs/types"
import { getPercentageDiff } from "./get-percentage-diff"
import { convertToLocale } from "./money"

type VariantWithPrice = HttpTypes.StoreProductVariant & {
  calculated_price?: {
    calculated_amount: number
    original_amount: number
    currency_code: string
    calculated_price: {
      price_list_type: string
    }
  }
}

export const getPricesForVariant = (
  variant: VariantWithPrice,
  productMetadata?: Record<string, unknown> | null
) => {
  if (!variant?.calculated_price?.calculated_amount) {
    return null
  }

  const calculatedAmount = variant.calculated_price.calculated_amount
  const currencyCode = variant.calculated_price.currency_code

  // MVP shortcut: Medusa v2 has no first-class "compare-at" price. When a
  // real price-list sale isn't active, fall back to a manually-set
  // metadata.compare_at_amount (set by the seed script) to still show a
  // strikethrough/savings badge. Real discounts should use price lists.
  const compareAtAmount = Number(productMetadata?.compare_at_amount)
  const hasManualCompareAt =
    Number.isFinite(compareAtAmount) && compareAtAmount > calculatedAmount

  const isNativeSale =
    variant.calculated_price.calculated_price.price_list_type === "sale"

  const originalAmount =
    isNativeSale || !hasManualCompareAt
      ? variant.calculated_price.original_amount
      : compareAtAmount

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: convertToLocale({
      amount: calculatedAmount,
      currency_code: currencyCode,
    }),
    original_price_number: originalAmount,
    original_price: convertToLocale({
      amount: originalAmount,
      currency_code: currencyCode,
    }),
    currency_code: currencyCode,
    price_type:
      isNativeSale || hasManualCompareAt ? "sale" : "default",
    percentage_diff: getPercentageDiff(originalAmount, calculatedAmount),
  }
}

export function getProductPrice({
  product,
  variantId,
}: {
  product: HttpTypes.StoreProduct
  variantId?: string
}) {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const cheapestVariant = (product.variants as VariantWithPrice[])
      .filter((v) => !!v.calculated_price)
      .sort((a, b) => {
        return (
          (a.calculated_price?.calculated_amount ?? 0) -
          (b.calculated_price?.calculated_amount ?? 0)
        )
      })[0]

    return getPricesForVariant(cheapestVariant, product.metadata)
  }

  const variantPrice = () => {
    if (!product || !variantId) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variantId || v.sku === variantId
    ) as VariantWithPrice | undefined

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant, product.metadata)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
