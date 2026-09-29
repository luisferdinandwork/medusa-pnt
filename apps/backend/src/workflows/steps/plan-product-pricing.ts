import type {
  BatchPriceListPricesWorkflowDTO,
  CreatePriceListWorkflowInputDTO,
  UpdatePriceListWorkflowInputDTO,
} from "@medusajs/framework/types"
import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  findManagedList,
  isBasePrice,
  LEGACY_COMPARE_AT_KEY,
  loadPricingProducts,
  MANAGED_BY,
} from "../../lib/product-pricing"

export type ProductPricingVariantInput = {
  id: string
  /** New regular price. Omitted or null leaves the current one. */
  base_amount?: number | null
  /** Sale price. null removes it, omitted leaves the current one. */
  sale_amount?: number | null
}

export type UpdateProductPricingInput = {
  product_id: string
  currency_code: string
  variants: ProductPricingVariantInput[]
  sale_starts_at?: string | null
  sale_ends_at?: string | null
  /** Drop the legacy `metadata.compare_at_amount` "was" price. */
  remove_compare_at?: boolean
}

type VariantPriceUpdate = {
  id: string
  prices: { id?: string; amount: number; currency_code: string }[]
}

export type ProductPricingPlan = {
  variant_updates: VariantPriceUpdate[]
  create_price_lists: CreatePriceListWorkflowInputDTO[]
  update_price_lists: UpdatePriceListWorkflowInputDTO[]
  price_list_batch: BatchPriceListPricesWorkflowDTO | null
  delete_price_list_ids: string[]
  product_updates: { id: string; metadata: Record<string, unknown> }[]
}

const invalid = (message: string) =>
  new MedusaError(MedusaError.Types.INVALID_DATA, message)

/**
 * Reads the product's current prices and works out what has to change: the
 * variants' base prices, and the product's own sale price list (created on the
 * first sale price, deleted when the last one is removed). Nothing is written
 * here; the workflow applies the plan through Medusa's own workflows.
 */
export const planProductPricingStep = createStep(
  "plan-product-pricing",
  async (input: UpdateProductPricingInput, { container }) => {
    const { products } = await loadPricingProducts(container, {
      filters: { id: input.product_id },
    })
    const product = products[0]
    if (!product) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        `Product ${input.product_id} not found`
      )
    }

    const currency = input.currency_code
    const variants = new Map((product.variants ?? []).map((v) => [v.id, v]))
    const managed = findManagedList(product)

    const startsAt = input.sale_starts_at ? new Date(input.sale_starts_at) : null
    const endsAt = input.sale_ends_at ? new Date(input.sale_ends_at) : null
    if (startsAt && endsAt && endsAt <= startsAt) {
      throw invalid("The sale must end after it starts.")
    }

    const variantUpdates: VariantPriceUpdate[] = []
    // variant id -> sale amount after this change (existing sale prices kept).
    const saleByVariant = new Map<string, number>()
    const salePriceIdByVariant = new Map<string, string>()

    for (const variant of managed ? variants.values() : []) {
      const current = (variant.prices ?? []).find(
        (price) =>
          price.price_list_id === managed?.id && price.currency_code === currency
      )
      if (current) {
        saleByVariant.set(variant.id, Number(current.amount))
        salePriceIdByVariant.set(variant.id, current.id)
      }
    }

    // variant id -> regular price after this change.
    const baseByVariant = new Map<string, number | null>()
    for (const variant of variants.values()) {
      const base = (variant.prices ?? []).find((price) =>
        isBasePrice(price, currency)
      )
      baseByVariant.set(variant.id, base ? Number(base.amount) : null)
    }

    for (const change of input.variants) {
      const variant = variants.get(change.id)
      if (!variant) {
        throw invalid(`Variant ${change.id} does not belong to this product.`)
      }
      const prices = variant.prices ?? []
      const base = prices.find((price) => isBasePrice(price, currency))

      if (change.base_amount != null && change.base_amount !== baseByVariant.get(variant.id)) {
        baseByVariant.set(variant.id, change.base_amount)
        // Every non-price-list price is sent back: the price set keeps only
        // the prices it receives, so other currencies and region prices must
        // be listed (by id, which keeps their rules) to survive.
        const kept = prices
          .filter((price) => !price.price_list_id && price.id !== base?.id)
          .map((price) => ({
            id: price.id,
            amount: Number(price.amount),
            currency_code: price.currency_code,
          }))
        variantUpdates.push({
          id: variant.id,
          prices: [
            ...kept,
            {
              ...(base ? { id: base.id } : {}),
              amount: change.base_amount,
              currency_code: currency,
            },
          ],
        })
      }

      if (change.sale_amount === null) {
        saleByVariant.delete(variant.id)
      } else if (change.sale_amount !== undefined) {
        saleByVariant.set(variant.id, change.sale_amount)
      }
    }

    // Checked after all changes, so lowering a regular price below a sale
    // price that was left alone is caught too.
    for (const [variantId, amount] of saleByVariant) {
      const variant = variants.get(variantId)!
      const label = variant.title ?? variant.sku ?? variant.id
      const baseAmount = baseByVariant.get(variantId)
      if (baseAmount == null) {
        throw invalid(`${label}: set a regular price before a sale price.`)
      }
      if (amount >= baseAmount) {
        throw invalid(
          `${label}: the sale price must be lower than the regular price.`
        )
      }
    }

    const plan: ProductPricingPlan = {
      variant_updates: variantUpdates,
      create_price_lists: [],
      update_price_lists: [],
      price_list_batch: null,
      delete_price_list_ids: [],
      product_updates: [],
    }

    const listDetails = {
      title: `Sale: ${product.title}`,
      description:
        "Managed from the product's Price & sale card. Edit it there so the list stays in sync.",
      starts_at: startsAt?.toISOString() ?? null,
      ends_at: endsAt?.toISOString() ?? null,
      status: "active" as const,
    }

    if (!managed && saleByVariant.size) {
      plan.create_price_lists.push({
        ...listDetails,
        metadata: { managed_by: MANAGED_BY, product_id: product.id },
        prices: [...saleByVariant].map(([variantId, amount]) => ({
          variant_id: variantId,
          amount,
          currency_code: currency,
        })),
      })
    } else if (managed && !saleByVariant.size) {
      plan.delete_price_list_ids.push(managed.id)
    } else if (managed) {
      plan.update_price_lists.push({ id: managed.id, ...listDetails })

      const batch: BatchPriceListPricesWorkflowDTO = {
        id: managed.id,
        create: [],
        update: [],
        delete: [],
      }
      for (const [variantId, priceId] of salePriceIdByVariant) {
        const amount = saleByVariant.get(variantId)
        if (amount === undefined) {
          batch.delete.push(priceId)
        }
      }
      for (const [variantId, amount] of saleByVariant) {
        const priceId = salePriceIdByVariant.get(variantId)
        if (!priceId) {
          batch.create.push({ variant_id: variantId, amount, currency_code: currency })
        } else {
          batch.update.push({
            id: priceId,
            variant_id: variantId,
            amount,
            currency_code: currency,
          })
        }
      }
      plan.price_list_batch = batch
    }

    if (input.remove_compare_at && product.metadata?.[LEGACY_COMPARE_AT_KEY] !== undefined) {
      // Product metadata is replaced as a whole, so the rest is sent back.
      const { [LEGACY_COMPARE_AT_KEY]: _removed, ...rest } = product.metadata
      plan.product_updates.push({ id: product.id, metadata: rest })
    }

    return new StepResponse(plan)
  }
)
