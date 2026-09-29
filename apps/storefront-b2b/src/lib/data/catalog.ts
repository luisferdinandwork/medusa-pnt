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

// The category and every subcategory below it: products are assigned to the
// deepest category (Footwear > Sepatu Bola), and the filter uses main ones.
async function categoryBranch(categoryId: string) {
  const { product_categories } = await sdk.store.category.list(
    { limit: 500, fields: "id,parent_category_id" },
    await getAuthHeaders()
  )
  const ids = [categoryId]
  for (let i = 0; i < ids.length; i++) {
    for (const category of product_categories) {
      if (category.parent_category_id === ids[i] && !ids.includes(category.id)) {
        ids.push(category.id)
      }
    }
  }
  return ids
}

export async function listProducts(params: {
  q?: string
  categoryId?: string
  page?: number
}) {
  const region = await getRegion()
  const page = Math.max(1, params.page ?? 1)
  const categoryIds = params.categoryId ? await categoryBranch(params.categoryId) : null
  const { products, count } = await sdk.store.product.list(
    {
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
      region_id: region.id,
      fields: PRODUCT_FIELDS,
      ...(params.q ? { q: params.q } : {}),
      ...(categoryIds ? { category_id: categoryIds } : {}),
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
