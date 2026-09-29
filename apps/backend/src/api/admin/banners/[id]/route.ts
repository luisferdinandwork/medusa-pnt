import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MedusaError } from "@medusajs/framework/utils"
import { BANNER_MODULE } from "../../../../modules/banner"
import BannerModuleService from "../../../../modules/banner/service"
import { deleteBannerWorkflow } from "../../../../workflows/delete-banner"
import { updateBannerWorkflow } from "../../../../workflows/update-banner"
import { UpdateBannerBody } from "../validators"

export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: BannerModuleService = req.scope.resolve(BANNER_MODULE)
  const [banner] = await service.listBanners({ id: req.params.id })

  if (!banner) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      `Banner ${req.params.id} not found`
    )
  }

  res.json({ banner })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<UpdateBannerBody>,
  res: MedusaResponse
) => {
  const { result } = await updateBannerWorkflow(req.scope).run({
    input: { id: req.params.id, data: req.validatedBody },
  })

  res.json({ banner: result })
}

export const DELETE = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  await deleteBannerWorkflow(req.scope).run({
    input: { id: req.params.id },
  })

  res.json({ id: req.params.id, object: "banner", deleted: true })
}
