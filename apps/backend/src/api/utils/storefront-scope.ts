import type { MedusaStoreRequest } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import storefrontSalesChannelLink from "../../links/storefront-sales-channel"

/**
 * The key of the storefront that owns the request's publishable API key, or
 * undefined when the key is not linked to one. Store content routes use it to
 * hide records that belong to a different shop front.
 */
export const resolveStorefrontKey = async (
  req: MedusaStoreRequest
): Promise<string | undefined> => {
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids ?? []
  if (!salesChannelIds.length) {
    return undefined
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: storefrontSalesChannelLink.entryPoint,
    fields: ["storefront.key"],
    filters: { sales_channel_id: salesChannelIds },
  })

  return data[0]?.storefront?.key
}

// Content with no storefront_key is shared by every shop front.
export const storefrontFilter = (key: string | undefined) =>
  key ? { $or: [{ storefront_key: null }, { storefront_key: key }] } : {}
