import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"
import {
  PRODUCT_STORY_FIELDS,
  ProductStoryData,
  toDate,
} from "../../modules/content/types"

type UpdateProductStoryStepInput = {
  id: string
  data: Partial<ProductStoryData>
}

export const updateProductStoryStep = createStep(
  "update-product-story",
  async ({ id, data }: UpdateProductStoryStepInput, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)

    const previous = await service.retrieveProductStory(id)
    const snapshot = Object.fromEntries(
      PRODUCT_STORY_FIELDS.map((field) => [field, previous[field]])
    )

    const { published_at, ...rest } = data
    const updated = await service.updateProductStories({
      id,
      ...rest,
      ...(published_at === undefined
        ? {}
        : { published_at: toDate(published_at) }),
    })
    return new StepResponse(updated, { id, snapshot })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.updateProductStories({
      id: compensation.id,
      ...compensation.snapshot,
    })
  }
)
