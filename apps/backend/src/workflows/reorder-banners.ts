import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { reorderBannersStep } from "./steps/reorder-banners"

// Saves the order of one homepage section after a drag or move in the admin.
export const reorderBannersWorkflow = createWorkflow(
  "reorder-banners",
  (input: { ids: string[] }) => {
    reorderBannersStep(input.ids)
    return new WorkflowResponse(void 0)
  }
)
