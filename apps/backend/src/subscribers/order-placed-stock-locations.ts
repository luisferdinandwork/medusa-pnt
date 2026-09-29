import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyOrderStockLocationsWorkflow } from "../workflows/apply-order-stock-locations"

// Takes each ordered item's stock from the location the shopper picked on the
// storefront (omnichannel), instead of the first location Medusa found.
export default async function orderPlacedStockLocations({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { result } = await applyOrderStockLocationsWorkflow(container).run({
    input: { order_id: data.id },
  })

  if (result.moves.length) {
    logger.info(
      `Order ${data.id}: moved ${result.moves.length} reservation(s) to the shopper's chosen stock location.`
    )
  }
  for (const skip of result.skipped) {
    logger.warn(
      `Order ${data.id}: line ${skip.line_item_id} kept its reservation instead of moving to ${skip.location_id} (${skip.reason}).`
    )
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
}
