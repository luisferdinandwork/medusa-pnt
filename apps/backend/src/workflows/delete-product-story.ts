import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteProductStoryStep } from "./steps/delete-product-story"

export const deleteProductStoryWorkflow = createWorkflow(
  "delete-product-story",
  (input: { id: string }) => {
    deleteProductStoryStep(input.id)
    return new WorkflowResponse(void 0)
  }
)
