import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

export const deleteBannerStep = createStep(
  "delete-banner",
  async (id: string, { container }) => {
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    await service.softDeleteBanners(id)
    return new StepResponse(void 0, id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    await service.restoreBanners(id)
  }
)
