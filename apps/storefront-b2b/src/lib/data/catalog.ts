import "server-only"
import { HttpTypes } from "@medusajs/types"
import { sdk } from "@/lib/sdk"
import { getAuthHeaders } from "@/lib/cookies"

export const PAGE_SIZE = 24

export async function getRegion(): Promise<HttpTypes.StoreRegion> {
  const { regions } = await sdk.store.region.list()
  const region =
    regions.find((r) => r.countries?.some((c) => c.iso_2 === "id")) ?? regions[0]
  if (!region) throw new Error("Belum ada region di backend Medusa.")
  return region
}

const PRODUCT_FIELDS =
  "*variants.calculated_price,+variants.inventory_quantity,*variants.options,+thumbnail,*images"

export async function listProducts(params: {
  q?: string
  categoryId?: string
  page?: number
}) {
  const region = await getRegion()
  const page = Math.max(1, params.page ?? 1)
  const { products, count } = await sdk.store.product.list(
    {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      region_id: region.id,
      fields: PRODUCT_FIELDS,
      ...(params.q ? { q: params.q } : {}),
      ...(params.categoryId ? { category_id: [params.categoryId] } : {}),
    },
    await getAuthHeaders()
  )
  return { products, count, pages: Math.max(1, Math.ceil(count / PAGE_SIZE)) }
}

export async function getProduct(handle: string) {
  const region = await getRegion()
  const { products } = await sdk.store.product.list(
    {
      handle,
      limit: 1,
      region_id: region.id,
      fields: `${PRODUCT_FIELDS},*options,*options.values`,
    },
    await getAuthHeaders()
  )
  return products[0] ?? null
}

export async function listCategories() {
  const { product_categories } = await sdk.store.category.list(
    { parent_category_id: "null", limit: 50 },
    await getAuthHeaders()
  )
  return product_categories
}

export function lowestPrice(product: HttpTypes.StoreProduct) {
  const prices = (product.variants ?? [])
    .map((v) => v.calculated_price)
    .filter((p) => p?.calculated_amount != null)
  if (!prices.length) return null
  const min = prices.reduce((a, b) =>
    a!.calculated_amount! <= b!.calculated_amount! ? a : b
  )
  return { amount: min!.calculated_amount!, currency: min!.currency_code ?? "idr" }
}
