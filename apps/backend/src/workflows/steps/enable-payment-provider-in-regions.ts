import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"

type RegionRow = {
  id: string
  currency_code: string
  payment_providers?: ({ id: string } | null)[] | null
}

const toLinks = (providerId: string, regionIds: string[]) =>
  regionIds.map((regionId) => ({
    [Modules.REGION]: { region_id: regionId },
    [Modules.PAYMENT]: { payment_provider_id: providerId },
  }))

// Medusa only opens a payment session with a provider its region offers.
// Midtrans and DOKU charge in rupiah, so their provider is added to every IDR
// region. Which storefront shows which gateway is decided by the gateway's
// sales channels, not by the region.
export const enablePaymentProviderInRegionsStep = createStep(
  "enable-payment-provider-in-regions",
  async ({ provider_id }: { provider_id: string }, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const link = container.resolve(ContainerRegistrationKeys.LINK)

    const { data } = await query.graph({
      entity: "region",
      fields: ["id", "currency_code", "payment_providers.id"],
    })
    const regionIds = (data as RegionRow[])
      .filter(
        (region) =>
          region.currency_code?.toLowerCase() === "idr" &&
          !region.payment_providers?.some((provider) => provider?.id === provider_id)
      )
      .map((region) => region.id)

    if (!regionIds.length) {
      return new StepResponse(void 0)
    }
    await link.create(toLinks(provider_id, regionIds))
    return new StepResponse(void 0, { providerId: provider_id, regionIds })
  },
  async (compensation, { container }) => {
    if (!compensation) {
      return
    }
    const link = container.resolve(ContainerRegistrationKeys.LINK)
    await link.dismiss(toLinks(compensation.providerId, compensation.regionIds))
  }
)
