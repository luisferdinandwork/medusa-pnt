import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteArticleStep } from "./steps/delete-article"

export const deleteArticleWorkflow = createWorkflow(
  "delete-article",
  (input: { id: string }) => {
    deleteArticleStep(input.id)
    return new WorkflowResponse(void 0)
  }
)
