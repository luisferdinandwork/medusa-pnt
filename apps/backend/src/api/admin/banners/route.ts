import type {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { BANNER_MODULE } from "../../../modules/banner"
import BannerModuleService from "../../../modules/banner/service"
import { createBannerWorkflow } from "../../../workflows/create-banner"
import { CreateBannerBody } from "./validators"

const text = (value: unknown) =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : undefined

// A storefront's banners, section by section in homepage order.
export const GET = async (
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) => {
  const service: BannerModuleService = req.scope.resolve(BANNER_MODULE)
  const storefrontKey = text(req.query.storefront_key)
  const placement = text(req.query.placement)

  const [banners, count] = await service.listAndCountBanners(
    {
      ...(storefrontKey ? { storefront_key: storefrontKey } : {}),
      ...(placement ? { placement } : {}),
    },
    { order: { placement: "ASC", rank: "ASC", created_at: "ASC" }, take: 500 }
  )

  res.json({ banners, count })
}

export const POST = async (
  req: AuthenticatedMedusaRequest<CreateBannerBody>,
  res: MedusaResponse
) => {
  const { result } = await createBannerWorkflow(req.scope).run({
    input: req.validatedBody,
  })

  res.status(201).json({ banner: result })
}
