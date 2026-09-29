import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"
import {
  BannerData,
  isInvertedSchedule,
  withDates,
} from "../../modules/banner/types"

export const createBannerStep = createStep(
  "create-banner",
  async (input: BannerData, { container }) => {
    if (isInvertedSchedule(input.starts_at, input.ends_at)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The banner must end after it starts"
      )
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)

    // A new banner goes to the end of its section unless a rank is given.
    let rank = input.rank
    if (rank === undefined) {
      const [last] = await service.listBanners(
        { storefront_key: input.storefront_key, placement: input.placement },
        { order: { rank: "DESC" }, take: 1 }
      )
      rank = last ? last.rank + 1 : 0
    }

    const banner = await service.createBanners({ ...withDates(input), rank })
    return new StepResponse(banner, banner.id)
  },
  async (id, { container }) => {
    if (!id) {
      return
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    await service.deleteBanners(id)
  }
)
