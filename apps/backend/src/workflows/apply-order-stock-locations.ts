import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { updateReservationsStep } from "@medusajs/medusa/core-flows"
import { planReservationMovesStep } from "./steps/plan-reservation-moves"

type ApplyOrderStockLocationsInput = { order_id: string }

// Moves a placed order's reservations to the stock locations its line items
// were bought from (`metadata.stock_location_id`), so the stock is taken from
// the store or warehouse the shopper chose. Run from the order.placed
// subscriber; updateReservationsStep restores the old locations on failure.
export const applyOrderStockLocationsWorkflow = createWorkflow(
  "apply-order-stock-locations",
  (input: ApplyOrderStockLocationsInput) => {
    const plan = planReservationMovesStep(input)

    const moves = transform({ plan }, ({ plan }) => plan.moves)
    updateReservationsStep(moves)

    return new WorkflowResponse(plan)
  }
)
