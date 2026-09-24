import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { STOREFRONT_MODULE } from "../../modules/storefront"
import StorefrontModuleService from "../../modules/storefront/service"
import { StorefrontData, toModelData } from "../../modules/storefront/types"

export const createStorefrontStep = createStep(
  "create-storefront",
  async (input: StorefrontData, { container }) => {
    const service: StorefrontModuleService = container.resolve(STOREFRONT_MODULE)
    const storefront = await service.createStorefronts(toModelData(input))
    return new StepResponse(storefront, storefront.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: StorefrontModuleService = container.resolve(STOREFRONT_MODULE)
    await service.deleteStorefronts(id)
  }
)
