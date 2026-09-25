import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"
import { ArticleData, toDate } from "../../modules/content/types"

export const createArticleStep = createStep(
  "create-article",
  async (input: ArticleData, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    const article = await service.createArticles({
      ...input,
      published_at: toDate(input.published_at),
    })
    return new StepResponse(article, article.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)
    await service.deleteArticles(id)
  }
)
