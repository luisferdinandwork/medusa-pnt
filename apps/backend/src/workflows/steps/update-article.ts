import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CONTENT_MODULE } from "../../modules/content"
import ContentModuleService from "../../modules/content/service"
import {
  ARTICLE_FIELDS,
  ArticleData,
  toDate,
} from "../../modules/content/types"

type UpdateArticleStepInput = { id: string; data: Partial<ArticleData> }

export const updateArticleStep = createStep(
  "update-article",
  async ({ id, data }: UpdateArticleStepInput, { container }) => {
    const service: ContentModuleService = container.resolve(CONTENT_MODULE)

    const previous = await service.retrieveArticle(id)
    const snapshot = Object.fromEntries(
      ARTICLE_FIELDS.map((field) => [field, previous[field]])
    )

    const { published_at, ...rest } = data
    const updated = await service.updateArticles({
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
    await service.updateArticles({
      id: compensation.id,
      ...compensation.snapshot,
    })
  }
)
