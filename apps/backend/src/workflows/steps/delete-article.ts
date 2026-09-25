import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"

export const deleteArticleStep = createStep(
  "delete-article",
  async (id: string, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.softDeleteArticles(id)
    return new StepResponse(void 0, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.restoreArticles(id)
  }
)
