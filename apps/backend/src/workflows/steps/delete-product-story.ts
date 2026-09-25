import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"

export const deleteProductStoryStep = createStep(
  "delete-product-story",
  async (id: string, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.softDeleteProductStories(id)
    return new StepResponse(void 0, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.restoreProductStories(id)
  }
)
