import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteBannerStep } from "./steps/delete-banner"

export const deleteBannerWorkflow = createWorkflow(
  "delete-banner",
  (input: { id: string }) => {
    deleteBannerStep(input.id)
    return new WorkflowResponse(void 0)
  }
)
