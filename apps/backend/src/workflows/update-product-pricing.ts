import {
  createWorkflow,
  when,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  batchPriceListPricesWorkflow,
  createPriceListsWorkflow,
  deletePriceListsWorkflow,
  updatePriceListsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  planProductPricingStep,
  type UpdateProductPricingInput,
} from "./steps/plan-product-pricing"

// Saves a product's regular and sale prices in one go (the admin's "Price &
// sale" card). The regular price is the variant's plain price; the sale prices
// sit in a price list of type "sale" that belongs to this product only, so each
// product can have its own sale period. Each part runs through Medusa's own
// workflow, which also undoes it if a later part fails.
export const updateProductPricingWorkflow = createWorkflow(
  "update-product-pricing",
  (input: UpdateProductPricingInput) => {
    const plan = planProductPricingStep(input)

    when("base-prices-changed", { plan }, ({ plan }) => plan.variant_updates.length > 0).then(
      () => {
        updateProductVariantsWorkflow.runAsStep({
          input: { product_variants: plan.variant_updates },
        })
      }
    )

    when("sale-list-created", { plan }, ({ plan }) => plan.create_price_lists.length > 0).then(
      () => {
        createPriceListsWorkflow.runAsStep({
          input: { price_lists_data: plan.create_price_lists },
        })
      }
    )

    when("sale-list-updated", { plan }, ({ plan }) => plan.update_price_lists.length > 0).then(
      () => {
        updatePriceListsWorkflow.runAsStep({
          input: { price_lists_data: plan.update_price_lists },
        })
      }
    )

    when("sale-prices-changed", { plan }, ({ plan }) => !!plan.price_list_batch).then(
      () => {
        batchPriceListPricesWorkflow.runAsStep({
          input: { data: plan.price_list_batch! },
        })
      }
    )

    when("sale-list-deleted", { plan }, ({ plan }) => plan.delete_price_list_ids.length > 0).then(
      () => {
        deletePriceListsWorkflow.runAsStep({
          input: { ids: plan.delete_price_list_ids },
        })
      }
    )

    when("compare-at-removed", { plan }, ({ plan }) => plan.product_updates.length > 0).then(
      () => {
        updateProductsWorkflow.runAsStep({
          input: { products: plan.product_updates },
        })
      }
    )

    return new WorkflowResponse(plan)
  }
)
