import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStoryData } from "../modules/content/types"
import { updateProductStoryStep } from "./steps/update-product-story"

type UpdateProductStoryWorkflowInput = {
  id: string
  data: Partial<ProductStoryData>
}

export const updateProductStoryWorkflow = createWorkflow(
  "update-product-story",
  (input: UpdateProductStoryWorkflowInput) => {
    const story = updateProductStoryStep(input)
    return new WorkflowResponse(story)
  }
)
