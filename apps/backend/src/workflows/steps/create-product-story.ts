import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"
import { ProductStoryData, toDate } from "../../modules/content/types"

export const createProductStoryStep = createStep(
  "create-product-story",
  async (input: ProductStoryData, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    const story = await service.createProductStories({
      ...input,
      published_at: toDate(input.published_at),
    })
    return new StepResponse(story, story.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.deleteProductStories(id)
  }
)
