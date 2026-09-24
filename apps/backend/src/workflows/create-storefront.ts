import { Modules } from "@medusajs/framework/utils"
import {
  createWorkflow,
  transform,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { STOREFRONT_MODULE } from "../modules/storefront"
import { StorefrontData } from "../modules/storefront/types"
import { createStorefrontStep } from "./steps/create-storefront"

type CreateStorefrontWorkflowInput = {
  storefront: StorefrontData
  sales_channel_id: string
}

export const createStorefrontWorkflow = createWorkflow(
  "create-storefront",
  (input: CreateStorefrontWorkflowInput) => {
    const storefront = createStorefrontStep(input.storefront)

    const links = transform({ storefront, input }, (data) => [
      {
        [STOREFRONT_MODULE]: { storefront_id: data.storefront.id },
        [Modules.SALES_CHANNEL]: {
          sales_channel_id: data.input.sales_channel_id,
        },
      },
    ])
    createRemoteLinkStep(links)

    return new WorkflowResponse(storefront)
  }
)
