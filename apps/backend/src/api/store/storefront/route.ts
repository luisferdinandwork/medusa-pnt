import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  ContainerRegistrationKeys,
  MedusaError,
} from "@medusajs/framework/utils"
import storefrontSalesChannelLink from "../../../links/storefront-sales-channel"

// Returns the copy and branding of the storefront that owns the request's
// publishable API key (resolved through the key's sales channel).
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids ?? []
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: storefrontSalesChannelLink.entryPoint,
    fields: ["storefront.*"],
    filters: { sales_channel_id: salesChannelIds },
  })

  const storefront = data[0]?.storefront
  if (!storefront) {
    throw new MedusaError(
      MedusaError.Types.NOT_FOUND,
      "No storefront is configured for this publishable API key"
    )
  }

  const { id, created_at, updated_at, deleted_at, ...config } = storefront
  res.json({ storefront: config })
}
