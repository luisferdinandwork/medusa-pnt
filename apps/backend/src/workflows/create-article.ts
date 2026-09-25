import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ArticleData } from "../modules/content/types"
import { createArticleStep } from "./steps/create-article"

export const createArticleWorkflow = createWorkflow(
  "create-article",
  (input: ArticleData) => {
    const article = createArticleStep(input)
    return new WorkflowResponse(article)
  }
)
