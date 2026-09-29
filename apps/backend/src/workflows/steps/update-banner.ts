import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"
import {
  BANNER_FIELDS,
  BannerData,
  isInvertedSchedule,
  withDates,
} from "../../modules/banner/types"

type UpdateBannerStepInput = {
  id: string
  data: Partial<BannerData>
}

export const updateBannerStep = createStep(
  "update-banner",
  async ({ id, data }: UpdateBannerStepInput, { container }) => {
    const service: BannerModuleService = container.resolve(BANNER_MODULE)

    const previous = await service.retrieveBanner(id)
    const snapshot = Object.fromEntries(
      BANNER_FIELDS.map((field) => [field, previous[field]])
    )

    const startsAt = data.starts_at === undefined ? previous.starts_at : data.starts_at
    const endsAt = data.ends_at === undefined ? previous.ends_at : data.ends_at
    if (isInvertedSchedule(startsAt, endsAt)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "The banner must end after it starts"
      )
    }

    const updated = await service.updateBanners({ id, ...withDates(data) })
    return new StepResponse(updated, { id, snapshot })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    await service.updateBanners({ id: compensation.id, ...compensation.snapshot })
  }
)
