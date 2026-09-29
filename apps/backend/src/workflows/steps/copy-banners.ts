import { MedusaError } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { BANNER_MODULE } from "../../modules/banner"
import BannerModuleService from "../../modules/banner/service"

export type CopyBannersStepInput = {
  from_storefront_key: string
  to_storefront_key: string
  /** Remove the target's own banners first instead of adding after them. */
  replace?: boolean
}

/**
 * Copies every banner of one storefront to another, e.g. to start a new shop
 * front from an existing homepage. The images are shared (same URLs).
 */
export const copyBannersStep = createStep(
  "copy-banners",
  async (input: CopyBannersStepInput, { container }) => {
    if (input.from_storefront_key === input.to_storefront_key) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Pick two different storefronts"
      )
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)

    const source = await service.listBanners(
      { storefront_key: input.from_storefront_key },
      { order: { placement: "ASC", rank: "ASC" } }
    )
    if (!source.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `${input.from_storefront_key} has no banners to copy`
      )
    }

    const existing = await service.listBanners({
      storefront_key: input.to_storefront_key,
    })
    const removedIds = input.replace ? existing.map((banner) => banner.id) : []
    if (removedIds.length) {
      await service.softDeleteBanners(removedIds)
    }

    // Appended copies continue after the target's own banners.
    const offset = input.replace
      ? 0
      : existing.reduce((max, banner) => Math.max(max, banner.rank + 1), 0)

    const created = await service.createBanners(
      source.map((banner) => ({
        storefront_key: input.to_storefront_key,
        placement: banner.placement,
        image_url: banner.image_url,
        mobile_image_url: banner.mobile_image_url,
        image_alt: banner.image_alt,
        eyebrow: banner.eyebrow,
        title: banner.title,
        subtitle: banner.subtitle,
        cta_label: banner.cta_label,
        text_align: banner.text_align,
        text_theme: banner.text_theme,
        link_type: banner.link_type,
        link_value: banner.link_value,
        is_active: banner.is_active,
        starts_at: banner.starts_at,
        ends_at: banner.ends_at,
        rank: banner.rank + offset,
      }))
    )

    return new StepResponse(created, {
      createdIds: created.map((banner) => banner.id),
      removedIds,
    })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const service: BannerModuleService = container.resolve(BANNER_MODULE)
    if (compensation.createdIds.length) {
      await service.deleteBanners(compensation.createdIds)
    }
    if (compensation.removedIds.length) {
      await service.restoreBanners(compensation.removedIds)
    }
  }
)
