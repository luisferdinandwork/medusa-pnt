import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Omnichannel: the shopper picks the stock location an item ships from. The
// location's omnichannel settings live in the stock location's metadata (edited
// in the admin on the location page) and the choice travels on the line item's
// metadata, from cart to order.

/** Keys on `stock_location.metadata`. */
export const LOCATION_META = {
  enabled: "omnichannel",
  code: "location_code",
  kind: "location_kind",
  isDefault: "omnichannel_default",
  latitude: "latitude",
  longitude: "longitude",
} as const

/** Keys on `line_item.metadata` (cart and order). */
export const LINE_ITEM_META = {
  locationId: "stock_location_id",
  locationCode: "stock_location_code",
  locationName: "stock_location_name",
  /** "delivery" (shipped from the location) or "pickup" (collected there). */
  fulfillment: "fulfillment_type",
} as const

export type FulfillmentType = "delivery" | "pickup"

export type LocationKind = "warehouse" | "store"

export type OmnichannelLocation = {
  id: string
  code: string
  name: string
  kind: LocationKind
  is_default: boolean
  latitude: number | null
  longitude: number | null
  address: {
    address_1: string | null
    address_2: string | null
    city: string | null
    province: string | null
    postal_code: string | null
  } | null
}

/** Units available per variant and location; null means no limit. */
export type AvailabilityMap = Record<string, Record<string, number | null>>

const toNumber = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number.parseFloat(String(value))
  return Number.isFinite(parsed) ? parsed : null
}

type StockLocationRow = {
  id: string
  name: string
  metadata?: Record<string, unknown> | null
  address?: OmnichannelLocation["address"]
  sales_channels?: { id: string }[] | null
}

export const toOmnichannelLocation = (
  location: StockLocationRow
): OmnichannelLocation | null => {
  const meta = location.metadata ?? {}
  if (meta[LOCATION_META.enabled] !== true) {
    return null
  }
  return {
    id: location.id,
    code: String(meta[LOCATION_META.code] ?? location.name),
    name: location.name,
    kind: meta[LOCATION_META.kind] === "store" ? "store" : "warehouse",
    is_default: meta[LOCATION_META.isDefault] === true,
    latitude: toNumber(meta[LOCATION_META.latitude]),
    longitude: toNumber(meta[LOCATION_META.longitude]),
    address: location.address
      ? {
          address_1: location.address.address_1 ?? null,
          address_2: location.address.address_2 ?? null,
          city: location.address.city ?? null,
          province: location.address.province ?? null,
          postal_code: location.address.postal_code ?? null,
        }
      : null,
  }
}

/**
 * The omnichannel locations serving the given sales channels, default first.
 * With no sales channel every omnichannel location is returned.
 */
export const listOmnichannelLocations = async (
  container: MedusaContainer,
  salesChannelIds: string[] = []
): Promise<OmnichannelLocation[]> => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "metadata", "address.*", "sales_channels.id"],
  })

  return (data as StockLocationRow[])
    .filter(
      (location) =>
        !salesChannelIds.length ||
        (location.sales_channels ?? []).some((channel) =>
          salesChannelIds.includes(channel.id)
        )
    )
    .map(toOmnichannelLocation)
    .filter((location): location is OmnichannelLocation => location !== null)
    .sort(
      (a, b) =>
        Number(b.is_default) - Number(a.is_default) ||
        a.code.localeCompare(b.code)
    )
}

type VariantRow = {
  id: string
  manage_inventory: boolean
  allow_backorder: boolean
  inventory_items?: {
    required_quantity: number
    inventory?: {
      location_levels?: {
        location_id: string
        stocked_quantity: number
        reserved_quantity: number
      }[]
    } | null
  }[]
}

/**
 * Sellable units of each variant at each location: stock minus reservations,
 * divided by how many inventory units one variant uses. Variants that don't
 * track inventory or allow backorders have no limit (null).
 */
export const getLocationAvailability = async (
  container: MedusaContainer,
  variantIds: string[],
  locationIds: string[]
): Promise<AvailabilityMap> => {
  const ids = Array.from(new Set(variantIds.filter(Boolean)))
  if (!ids.length || !locationIds.length) {
    return {}
  }

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "manage_inventory",
      "allow_backorder",
      "inventory_items.required_quantity",
      "inventory_items.inventory.location_levels.location_id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
    ],
    filters: { id: ids },
  })

  const result: AvailabilityMap = {}
  for (const variant of data as VariantRow[]) {
    const byLocation: Record<string, number | null> = {}
    for (const locationId of locationIds) {
      if (!variant.manage_inventory || variant.allow_backorder) {
        byLocation[locationId] = null
        continue
      }
      const items = variant.inventory_items ?? []
      byLocation[locationId] = items.length
        ? Math.min(
            ...items.map((item) => {
              const level = item.inventory?.location_levels?.find(
                (entry) => entry.location_id === locationId
              )
              const free = level
                ? Number(level.stocked_quantity) - Number(level.reserved_quantity)
                : 0
              return Math.max(
                0,
                Math.floor(free / Math.max(1, Number(item.required_quantity) || 1))
              )
            })
          )
        : 0
    }
    result[variant.id] = byLocation
  }
  return result
}

/** The location a line item ships from, or undefined when none was chosen. */
export const lineItemLocationId = (metadata?: Record<string, unknown> | null) => {
  const value = metadata?.[LINE_ITEM_META.locationId]
  return typeof value === "string" && value ? value : undefined
}

/** Whether a line is collected at its location (pickup) or shipped from it. */
export const lineItemFulfillment = (
  metadata?: Record<string, unknown> | null
): FulfillmentType =>
  metadata?.[LINE_ITEM_META.fulfillment] === "pickup" ? "pickup" : "delivery"
