import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  copyBannersStep,
  type CopyBannersStepInput,
} from "./steps/copy-banners"

// Starts a storefront's homepage from another one's banners.
export const copyStorefrontBannersWorkflow = createWorkflow(
  "copy-storefront-banners",
  (input: CopyBannersStepInput) => {
    const banners = copyBannersStep(input)
    return new WorkflowResponse(banners)
  }
)
