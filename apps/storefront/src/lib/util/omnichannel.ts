/**
 * Omnichannel: the shopper picks which stock location (a store or the
 * warehouse) an item ships from. These are the pure rules shared by the
 * product page, the cart and the cart server actions.
 */

export type StockLocationOption = {
  id: string
  code: string
  name: string
  kind: "warehouse" | "store"
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

/** Units per variant and location; null means no limit. */
export type LocationAvailability = Record<string, Record<string, number | null>>

export type OmnichannelData = {
  locations: StockLocationOption[]
  availability: LocationAvailability
}

export type Coordinates = { latitude: number; longitude: number }

/** Keys on the line item metadata, matching the backend. */
export const LINE_ITEM_LOCATION_KEYS = {
  id: "stock_location_id",
  code: "stock_location_code",
  name: "stock_location_name",
  fulfillment: "fulfillment_type",
} as const

/**
 * How the bag reaches the shopper: shipped from one or more locations, or
 * collected at a store. A cart gets one shipping method, so every line of a
 * bag shares the mode, and a pickup bag is collected at a single store.
 */
export type FulfillmentMode = "delivery" | "pickup"

export const lineFulfillment = (
  metadata: Record<string, unknown> | null | undefined
): FulfillmentMode =>
  metadata?.[LINE_ITEM_LOCATION_KEYS.fulfillment] === "pickup" ? "pickup" : "delivery"

type LineLike = { metadata?: Record<string, unknown> | null }

/** The bag's mode and, when picked up, its store. Empty bags have no mode. */
export const cartFulfillment = (
  lines: LineLike[],
  locations: StockLocationOption[]
): { mode: FulfillmentMode | null; pickupLocationId?: string } => {
  if (!lines.length) {
    return { mode: null }
  }
  const pickup = lines.find((line) => lineFulfillment(line.metadata) === "pickup")
  if (!pickup) {
    return { mode: "delivery" }
  }
  return { mode: "pickup", pickupLocationId: lineLocationId(pickup.metadata, locations) }
}

export const pickupLocations = (locations: StockLocationOption[]) =>
  locations.filter((location) => location.kind === "store")

export const EMPTY_OMNICHANNEL: OmnichannelData = { locations: [], availability: {} }

export const defaultLocation = (locations: StockLocationOption[]) =>
  locations.find((location) => location.is_default) ?? locations[0]

/** The location a cart line ships from; lines without one use the default. */
export const lineLocationId = (
  metadata: Record<string, unknown> | null | undefined,
  locations: StockLocationOption[]
) => {
  const id = metadata?.[LINE_ITEM_LOCATION_KEYS.id]
  if (typeof id === "string" && locations.some((location) => location.id === id)) {
    return id
  }
  return defaultLocation(locations)?.id
}

export const lineItemLocationMetadata = (
  location: StockLocationOption,
  fulfillment: FulfillmentMode = "delivery"
) => ({
  [LINE_ITEM_LOCATION_KEYS.id]: location.id,
  [LINE_ITEM_LOCATION_KEYS.code]: location.code,
  [LINE_ITEM_LOCATION_KEYS.name]: location.name,
  [LINE_ITEM_LOCATION_KEYS.fulfillment]: fulfillment,
})

/** Units of a variant at a location: null = no limit, 0 = none. */
export const unitsAt = (
  availability: LocationAvailability,
  variantId: string | undefined,
  locationId: string | undefined
): number | null => {
  if (!variantId || !locationId) {
    return 0
  }
  const byLocation = availability[variantId]
  if (!byLocation || !(locationId in byLocation)) {
    return 0
  }
  return byLocation[locationId]
}

export const hasUnits = (units: number | null, needed: number) =>
  units === null || units >= needed

/** Key for "units of this variant in the cart shipping from this location". */
export const cartQuantityKey = (variantId: string, locationId: string) =>
  `${variantId}:${locationId}`

/**
 * Why a location can't take more of a size, with the numbers, and where else
 * it can ship from when another location has it.
 */
export const locationStockMessage = (
  location: StockLocationOption,
  units: number,
  inCart: number,
  alternative?: StockLocationOption
) => {
  const base =
    units <= 0
      ? `Ukuran ini habis di ${location.name}.`
      : inCart >= units
      ? `Stok ukuran ini di ${location.name} tinggal ${units} dan semuanya sudah ada di tas kamu.`
      : `Stok ukuran ini di ${location.name} tinggal ${units}. Kamu masih bisa menambah ${
          units - inCart
        } lagi.`
  return alternative ? `${base} Ukuran ini masih tersedia di ${alternative.name}.` : base
}

/** Great-circle distance in kilometres. */
export const distanceKm = (from: Coordinates, location: StockLocationOption) => {
  if (location.latitude === null || location.longitude === null) {
    return null
  }
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(location.latitude - from.latitude)
  const dLng = toRad(location.longitude - from.longitude)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.latitude)) *
      Math.cos(toRad(location.latitude)) *
      Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const formatDistance = (km: number | null) => {
  if (km === null) {
    return null
  }
  if (km < 1) {
    return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`
  }
  return `${km.toLocaleString("id-ID", { maximumFractionDigits: km < 10 ? 1 : 0 })} km`
}

// A location has to be at least this much closer than the current choice
// before it is recommended, so equal addresses never trigger a suggestion.
const RECOMMEND_MARGIN_KM = 0.3

/**
 * The location to preselect: the default (DM) when it can ship, otherwise the
 * nearest location that can (or the first one, without the shopper's
 * position). `canShip` decides whether a location can take one more unit.
 */
export const pickLocation = (
  locations: StockLocationOption[],
  canShip: (locationId: string) => boolean,
  coords: Coordinates | null
) => {
  const fallback = defaultLocation(locations)
  if (fallback && canShip(fallback.id)) {
    return fallback
  }
  const withStock = locations.filter((location) => canShip(location.id))
  if (!withStock.length) {
    return fallback
  }
  if (!coords) {
    return withStock[0]
  }
  return [...withStock].sort(
    (a, b) => (distanceKm(coords, a) ?? Infinity) - (distanceKm(coords, b) ?? Infinity)
  )[0]
}

/**
 * The nearest location that can ship, when it is meaningfully closer to the
 * shopper than the selected one; otherwise null.
 */
export const recommendLocation = (
  locations: StockLocationOption[],
  canShip: (locationId: string) => boolean,
  selectedId: string | undefined,
  coords: Coordinates | null
) => {
  if (!coords) {
    return null
  }
  const selected = locations.find((location) => location.id === selectedId)
  const selectedKm = selected ? distanceKm(coords, selected) : null

  const nearest = locations
    .filter((location) => canShip(location.id))
    .map((location) => ({ location, km: distanceKm(coords, location) }))
    .filter((entry): entry is { location: StockLocationOption; km: number } => entry.km !== null)
    .sort((a, b) => a.km - b.km)[0]

  if (!nearest || nearest.location.id === selectedId) {
    return null
  }
  if (selectedKm !== null && selectedKm - nearest.km < RECOMMEND_MARGIN_KM) {
    return null
  }
  return nearest
}

export const locationKindLabel = (location: StockLocationOption) =>
  location.kind === "store" ? "Toko" : "Gudang"
