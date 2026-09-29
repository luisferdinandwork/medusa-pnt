import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BannerData } from "../modules/banner/types"
import { updateBannerStep } from "./steps/update-banner"

type UpdateBannerWorkflowInput = {
  id: string
  data: Partial<BannerData>
}

export const updateBannerWorkflow = createWorkflow(
  "update-banner",
  (input: UpdateBannerWorkflowInput) => {
    const banner = updateBannerStep(input)
    return new WorkflowResponse(banner)
  }
)
