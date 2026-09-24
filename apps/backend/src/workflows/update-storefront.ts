import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { StorefrontData } from "../modules/storefront/types"
import { updateStorefrontStep } from "./steps/update-storefront"

type UpdateStorefrontWorkflowInput = {
  id: string
  data: Partial<StorefrontData>
}

export const updateStorefrontWorkflow = createWorkflow(
  "update-storefront",
  (input: UpdateStorefrontWorkflowInput) => {
    const storefront = updateStorefrontStep(input)
    return new WorkflowResponse(storefront)
  }
)
