import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Product pricing: a product's regular ("base") price per variant and its sale
// price. The sale price lives in a Medusa price list of type "sale", one per
// product, created and kept in sync by the update-product-pricing workflow.
// The storefront shows the regular price struck through whenever that list is
// live (see `price_list_type === "sale"` in get-product-price.ts).

/** `price_list.metadata.managed_by` of the per-product sale lists. */
export const MANAGED_BY = "product-pricing"

/**
 * Legacy display-only "was" price the initial seed wrote to
 * `product.metadata`. Shoppers still paid the base price; the editor offers to
 * turn it into a real sale price.
 */
export const LEGACY_COMPARE_AT_KEY = "compare_at_amount"

const PRICING_PRODUCT_FIELDS = [
  "id",
  "title",
  "handle",
  "thumbnail",
  "status",
  "metadata",
  "variants.id",
  "variants.title",
  "variants.sku",
  "variants.variant_rank",
  "variants.price_set.id",
]

type RawPriceList = {
  id: string
  title: string
  type: string
  status: string
  starts_at: string | Date | null
  ends_at: string | Date | null
  metadata: Record<string, unknown> | null
}

export type RawPrice = {
  id: string
  amount: number
  currency_code: string
  rules_count?: number | null
  min_quantity?: number | null
  max_quantity?: number | null
  price_list_id?: string | null
  price_list?: RawPriceList | null
}

export type RawVariant = {
  id: string
  title: string | null
  sku: string | null
  variant_rank?: number | null
  prices?: RawPrice[] | null
}

export type RawPricingProduct = {
  id: string
  title: string
  handle: string | null
  thumbnail: string | null
  status: string
  metadata: Record<string, unknown> | null
  variants?: RawVariant[] | null
}

/** "live" = shoppers see the sale price right now. */
export type SaleState = "live" | "scheduled" | "expired" | "draft"

export type SaleListView = {
  id: string
  title: string
  type: string
  status: string
  starts_at: string | null
  ends_at: string | null
  state: SaleState
}

export type VariantPricingView = {
  id: string
  title: string
  sku: string | null
  base_price_id: string | null
  base_amount: number | null
  sale_price_id: string | null
  sale_amount: number | null
  /** Region-specific prices take precedence over the base price. */
  region_price_count: number
}

export type ProductPricingView = {
  product: {
    id: string
    title: string
    handle: string | null
    thumbnail: string | null
    status: string
  }
  currency_code: string
  variants: VariantPricingView[]
  /** The per-product sale list this editor manages, if the product has one. */
  sale: SaleListView | null
  /** Other price lists with prices for this product (edited under Price Lists). */
  other_price_lists: (SaleListView & { variant_count: number })[]
  legacy_compare_at: number | null
}

const toIso = (value: string | Date | null | undefined) =>
  value ? new Date(value).toISOString() : null

export const saleState = (
  list: Pick<RawPriceList, "status" | "starts_at" | "ends_at">,
  now = new Date()
): SaleState => {
  if (list.status !== "active") {
    return "draft"
  }
  if (list.starts_at && new Date(list.starts_at) > now) {
    return "scheduled"
  }
  if (list.ends_at && new Date(list.ends_at) <= now) {
    return "expired"
  }
  return "live"
}

const toListView = (list: RawPriceList): SaleListView => ({
  id: list.id,
  title: list.title,
  type: list.type,
  status: list.status,
  starts_at: toIso(list.starts_at),
  ends_at: toIso(list.ends_at),
  state: saleState(list),
})

export const isManagedList = (
  list: Pick<RawPriceList, "metadata"> | null | undefined,
  productId: string
) =>
  !!list &&
  list.metadata?.managed_by === MANAGED_BY &&
  list.metadata?.product_id === productId

/** The plain price for the currency: no price list, no rules, no quantity tiers. */
export const isBasePrice = (price: RawPrice, currencyCode: string) =>
  price.currency_code === currencyCode &&
  !price.price_list_id &&
  !price.rules_count &&
  price.min_quantity == null &&
  price.max_quantity == null

export const findManagedList = (product: RawPricingProduct) => {
  for (const variant of product.variants ?? []) {
    for (const price of variant.prices ?? []) {
      if (isManagedList(price.price_list, product.id)) {
        return price.price_list as RawPriceList
      }
    }
  }
  return null
}

export const readLegacyCompareAt = (
  metadata: Record<string, unknown> | null | undefined
) => {
  const value = Number(metadata?.[LEGACY_COMPARE_AT_KEY])
  return Number.isFinite(value) && value > 0 ? value : null
}

// Variants often share rank 0, so sizes fall back to natural order (39, 40, ...).
const byRank = (a: RawVariant, b: RawVariant) =>
  (a.variant_rank ?? 0) - (b.variant_rank ?? 0) ||
  (a.title ?? "").localeCompare(b.title ?? "", undefined, { numeric: true })

export const toPricingView = (
  product: RawPricingProduct,
  currencyCode: string
): ProductPricingView => {
  const managed = findManagedList(product)
  const others = new Map<string, { list: RawPriceList; variants: Set<string> }>()

  const variants = [...(product.variants ?? [])].sort(byRank).map((variant) => {
    const prices = variant.prices ?? []
    const base = prices.find((price) => isBasePrice(price, currencyCode))
    const sale = managed
      ? prices.find(
          (price) =>
            price.price_list_id === managed.id &&
            price.currency_code === currencyCode
        )
      : undefined

    for (const price of prices) {
      if (price.price_list && price.price_list_id !== managed?.id) {
        const entry = others.get(price.price_list.id) ?? {
          list: price.price_list,
          variants: new Set<string>(),
        }
        entry.variants.add(variant.id)
        others.set(price.price_list.id, entry)
      }
    }

    return {
      id: variant.id,
      title: variant.title ?? variant.sku ?? variant.id,
      sku: variant.sku,
      base_price_id: base?.id ?? null,
      base_amount: base ? Number(base.amount) : null,
      sale_price_id: sale?.id ?? null,
      sale_amount: sale ? Number(sale.amount) : null,
      region_price_count: prices.filter(
        (price) =>
          price.currency_code === currencyCode &&
          !price.price_list_id &&
          !!price.rules_count
      ).length,
    }
  })

  return {
    product: {
      id: product.id,
      title: product.title,
      handle: product.handle,
      thumbnail: product.thumbnail,
      status: product.status,
    },
    currency_code: currencyCode,
    variants,
    sale: managed ? toListView(managed) : null,
    other_price_lists: [...others.values()].map(({ list, variants }) => ({
      ...toListView(list),
      variant_count: variants.size,
    })),
    legacy_compare_at: readLegacyCompareAt(product.metadata),
  }
}

type LoadOptions = {
  filters: Record<string, unknown>
  pagination?: { skip: number; take: number; order?: Record<string, "ASC" | "DESC"> }
}

// The runtime price records carry these columns even though PriceDTO does not
// declare them.
type ListedPrice = {
  id: string
  amount: unknown
  currency_code: string
  price_set_id: string
  price_list_id?: string | null
  rules_count?: number | null
  min_quantity?: unknown
  max_quantity?: unknown
  price_list?: RawPriceList | null
}

const toNumberOrNull = (value: unknown) =>
  value === null || value === undefined ? null : Number(value)

/**
 * Products with every price of their variants, price-list prices included.
 * The prices are read from the Pricing Module rather than through
 * `variants.prices`: a price set only exposes its plain prices there, so sale
 * prices would be missing.
 */
export const loadPricingProducts = async (
  container: MedusaContainer,
  { filters, pagination }: LoadOptions
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const pricingModule = container.resolve(Modules.PRICING)

  const { data, metadata } = await query.graph({
    entity: "product",
    fields: PRICING_PRODUCT_FIELDS,
    filters,
    ...(pagination ? { pagination } : {}),
  })
  const products = data as unknown as (Omit<RawPricingProduct, "variants"> & {
    variants?: (RawVariant & { price_set?: { id: string } | null })[] | null
  })[]

  const priceSetIds = products.flatMap((product) =>
    (product.variants ?? []).flatMap((variant) =>
      variant.price_set?.id ? [variant.price_set.id] : []
    )
  )
  const prices = priceSetIds.length
    ? ((await pricingModule.listPrices(
        { price_set_id: priceSetIds },
        { relations: ["price_list"], take: null }
      )) as unknown as ListedPrice[])
    : []

  const pricesBySet = new Map<string, RawPrice[]>()
  for (const price of prices) {
    const list = pricesBySet.get(price.price_set_id) ?? []
    list.push({
      id: price.id,
      amount: Number(price.amount),
      currency_code: price.currency_code,
      rules_count: price.rules_count ?? 0,
      min_quantity: toNumberOrNull(price.min_quantity),
      max_quantity: toNumberOrNull(price.max_quantity),
      price_list_id: price.price_list_id ?? price.price_list?.id ?? null,
      price_list: price.price_list ?? null,
    })
    pricesBySet.set(price.price_set_id, list)
  }

  return {
    products: products.map(
      ({ variants, ...product }): RawPricingProduct => ({
        ...product,
        variants: (variants ?? []).map(({ price_set, ...variant }) => ({
          ...variant,
          prices: price_set ? pricesBySet.get(price_set.id) ?? [] : [],
        })),
      })
    ),
    count: metadata?.count ?? products.length,
  }
}

/** The store's default currency, which the editor prices in. */
export const getDefaultCurrencyCode = async (container: MedusaContainer) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["supported_currencies.currency_code", "supported_currencies.is_default"],
  })
  const currencies = stores[0]?.supported_currencies ?? []
  const preferred =
    currencies.find((currency) => currency?.is_default) ?? currencies[0]
  return preferred?.currency_code ?? "idr"
}
