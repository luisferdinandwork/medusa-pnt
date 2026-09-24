import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STOREFRONT_MODULE } from "../../modules/storefront"
import StorefrontModuleService from "../../modules/storefront/service"
import {
  STOREFRONT_FIELDS,
  StorefrontData,
  toModelData,
} from "../../modules/storefront/types"

type UpdateStorefrontStepInput = { id: string; data: Partial<StorefrontData> }

export const updateStorefrontStep = createStep(
  "update-storefront",
  async ({ id, data }: UpdateStorefrontStepInput, { container }) => {
    const service: StorefrontModuleService = container.resolve(STOREFRONT_MODULE)

    const previous = await service.retrieveStorefront(id)
    const snapshot = Object.fromEntries(
      STOREFRONT_FIELDS.map((field) => [field, previous[field]])
    )

    const updated = await service.updateStorefronts(toModelData({ id, ...data }))
    return new StepResponse(updated, { id, snapshot })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service: StorefrontModuleService = container.resolve(STOREFRONT_MODULE)
    await service.updateStorefronts(
      toModelData({ id: compensation.id, ...compensation.snapshot })
    )
  }
)
