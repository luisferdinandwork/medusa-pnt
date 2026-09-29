import type {
  MedusaResponse,
  MedusaStoreRequest,
} from "@medusajs/framework/http"
import {
  getLocationAvailability,
  listOmnichannelLocations,
} from "../../../../lib/omnichannel"

const MAX_VARIANTS = 100

const toList = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value]
  return values
    .flatMap((entry) => String(entry).split(","))
    .map((entry) => entry.trim())
    .filter(Boolean)
}

// The stock locations a shopper can pick for this storefront (resolved from the
// publishable key's sales channel), and the units of each ?variant_id left at
// each of them. Read live on every request: it decides what can be added.
export const GET = async (req: MedusaStoreRequest, res: MedusaResponse) => {
  const variantIds = toList(req.query.variant_id).slice(0, MAX_VARIANTS)
  const salesChannelIds = req.publishable_key_context?.sales_channel_ids ?? []

  const locations = await listOmnichannelLocations(req.scope, salesChannelIds)
  const availability = await getLocationAvailability(
    req.scope,
    variantIds,
    locations.map((location) => location.id)
  )

  res.json({ locations, availability })
}
