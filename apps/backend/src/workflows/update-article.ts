import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { ArticleData } from "../modules/content/types"
import { updateArticleStep } from "./steps/update-article"

type UpdateArticleWorkflowInput = {
  id: string
  data: Partial<ArticleData>
}

export const updateArticleWorkflow = createWorkflow(
  "update-article",
  (input: UpdateArticleWorkflowInput) => {
    const article = updateArticleStep(input)
    return new WorkflowResponse(article)
  }
)
