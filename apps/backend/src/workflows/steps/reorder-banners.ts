import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

/** Ranks the given banners 0..n in the order of `ids`. */
export const reorderBannersStep = createStep(
  "reorder-banners",
  async (ids: string[], { container }) => {
    const service: BannerModuleService = container.resolve(BANNER_MODULE)

    const banners = await service.listBanners({ id: ids })
    if (banners.length !== new Set(ids).size) {
      throw new MedusaError(
        MedusaError.Types.NOT_FOUND,
        "One or more banners to reorder were not found"
      )
    }

    const previous = banners.map(({ id, rank }) => ({ id, rank }))
    await service.updateBanners(ids.map((id, rank) => ({ id, rank })))
    return new StepResponse(void 0, previous)
  },
  async (previous, { container }) => {
    if (!previous?.length) {
      return
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    await service.updateBanners(previous)
  }
)
