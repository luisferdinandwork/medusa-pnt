import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { BannerData } from "../modules/banner/types"
import { createBannerStep } from "./steps/create-banner"

export const createBannerWorkflow = createWorkflow(
  "create-banner",
  (input: BannerData) => {
    const banner = createBannerStep(input)
    return new WorkflowResponse(banner)
  }
)
