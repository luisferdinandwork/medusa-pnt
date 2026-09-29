// Mirrors the /admin/product-pricing responses (src/lib/product-pricing.ts).

export type SaleState = "live" | "scheduled" | "expired" | "draft"

export type SaleList = {
  id: string
  title: string
  type: string
  status: string
  starts_at: string | null
  ends_at: string | null
  state: SaleState
}

export type VariantPricing = {
  id: string
  title: string
  sku: string | null
  base_price_id: string | null
  base_amount: number | null
  sale_price_id: string | null
  sale_amount: number | null
  region_price_count: number
}

export type ProductPricing = {
  product: {
    id: string
    title: string
    handle: string | null
    thumbnail: string | null
    status: string
  }
  currency_code: string
  variants: VariantPricing[]
  sale: SaleList | null
  other_price_lists: (SaleList & { variant_count: number })[]
  legacy_compare_at: number | null
}

export type AmountRange = { min: number; max: number }

export type ProductPricingRow = ProductPricing["product"] & {
  variant_count: number
  missing_price_count: number
  base_range: AmountRange | null
  sale_range: AmountRange | null
  sale: SaleList | null
  other_price_list_count: number
  legacy_compare_at: number | null
}

export const pricingQueryKey = (productId: string) => ["product-pricing", productId]
export const PRICING_LIST_QUERY_KEY = ["product-pricing-list"]
