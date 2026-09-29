"use server"

import { sdk } from "@lib/config"
import {
  EMPTY_OMNICHANNEL,
  type OmnichannelData,
} from "@lib/util/omnichannel"

/**
 * The stock locations this storefront ships from, and the units of each given
 * variant left at each of them. Never cached: it decides what can be added.
 */
export async function getOmnichannelAvailability(
  variantIds: string[]
): Promise<OmnichannelData> {
  const ids = Array.from(new Set(variantIds.filter(Boolean)))

  return sdk.client
    .fetch<OmnichannelData>(`/store/omnichannel/availability`, {
      method: "GET",
      query: ids.length ? { variant_id: ids.join(",") } : {},
      cache: "no-store",
    })
    .catch(() => EMPTY_OMNICHANNEL)
}
