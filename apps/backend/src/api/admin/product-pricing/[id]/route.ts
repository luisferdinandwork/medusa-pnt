import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import type { MedusaContainer } from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import {
  getDefaultCurrencyCode,
  loadPricingProducts,
  toPricingView,
} from "../../../../lib/product-pricing"
import { updateProductPricingWorkflow } from "../../../../workflows/update-product-pricing"
import { UpdateProductPricingBody } from "../validators"

const loadPricing = async (container: MedusaContainer, productId: string) => {
  const [currencyCode, { products }] = await Promise.all([
    getDefaultCurrencyCode(container),
    loadPricingProducts(container, { filters: { id: productId } }),
  ])

  if (!products.length) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Product ${productId} not found`
    )
  }

  return toPricingView(products[0], currencyCode)
}

// The product's regular and sale price per variant, in the store's default
// currency, plus the sale period.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  res.json({ pricing: await loadPricing(req.scope, req.params.id) })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateProductPricingBody>,
  res: MedusaResponse
) => {
  await updateProductPricingWorkflow(req.scope).run({
    input: {
      product_id: req.params.id,
      currency_code: await getDefaultCurrencyCode(req.scope),
      ...req.validatedBody,
    },
  })

  res.json({ pricing: await loadPricing(req.scope, req.params.id) })
}
