import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import {
  getDefaultCurrencyCode,
  loadPricingProducts,
  toPricingView,
} from "../../../lib/product-pricing"
import { parseListParams } from "../../utils/list-params"

const range = (values: (number | null)[]) => {
  const present = values.filter((value): value is number => value !== null)
  return present.length
    ? { min: Math.min(...present), max: Math.max(...present) }
    : null
}

// One row per product with its regular and sale price range, for the
// "Prices & sales" overview page.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const { q, limit, offset } = parseListParams(req)

  const [currencyCode, { products: rows, count }] = await Promise.all([
    getDefaultCurrencyCode(req.scope),
    loadPricingProducts(req.scope, {
      filters: q
        ? {
            $or: [
              { title: { $ilike: `%${q}%` } },
              { handle: { $ilike: `%${q}%` } },
            ],
          }
        : {},
      pagination: { skip: offset, take: limit, order: { title: "ASC" } },
    }),
  ])

  const products = rows.map((product) => {
    const view = toPricingView(product, currencyCode)
    return {
      ...view.product,
      variant_count: view.variants.length,
      missing_price_count: view.variants.filter((v) => v.base_amount === null)
        .length,
      base_range: range(view.variants.map((v) => v.base_amount)),
      sale_range: range(view.variants.map((v) => v.sale_amount)),
      sale: view.sale,
      other_price_list_count: view.other_price_lists.length,
      legacy_compare_at: view.legacy_compare_at,
    }
  })

  res.json({
    products,
    currency_code: currencyCode,
    count,
    limit,
    offset,
  })
}
