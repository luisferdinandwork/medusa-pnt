import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ProductStoryData } from "../modules/content/types"
import { createProductStoryStep } from "./steps/create-product-story"

export const createProductStoryWorkflow = createWorkflow(
  "create-product-story",
  (input: ProductStoryData) => {
    const story = createProductStoryStep(input)
    return new WorkflowResponse(story)
  }
)
