import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
} from "@medusajs/framework/utils"
import {
  createInventoryLevelsWorkflow,
  createLocationFulfillmentSetWorkflow,
  createServiceZonesWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateInventoryLevelsWorkflow,
  updateStockLocationsWorkflow,
} from "@medusajs/medusa/core-flows"
import { LOCATION_META, type LocationKind } from "../lib/omnichannel"

// Omnichannel stock locations for the SPECS storefronts, with dummy stock.
//
// - DM takes over the initial seed's "Gudang Jakarta" warehouse when it exists,
//   so its stock, past reservations and the shop's shipping options (which
//   belong to that warehouse) carry over.
// - FF001 and FS001 are created and given dummy stock for every product.
// - All three are linked to every sales channel.
// - The stores get a pickup fulfillment set with a free "Ambil di toko"
//   shipping option, which the checkout offers when the bag is picked up.
//
// Safe to re-run: locations are matched by their code, and existing stock
// levels are left alone. Pass `reset` (`npm run seed:omnichannel -- reset`) to
// re-apply the dummy stock to the two stores.

const ADDRESS = {
  address_1: "Specs Arena, Jl. Raya Daan Mogot No.151",
  address_2: "Duri Kepa, Kebon Jeruk",
  city: "Jakarta Barat",
  province: "DKI Jakarta",
  postal_code: "11510",
  country_code: "id",
}

// All three sit in the Specs Arena complex on Jl. Daan Mogot (OpenStreetMap).
// Coordinates are editable per location in the admin.
const SPECS_ARENA = { latitude: -6.1632533, longitude: 106.7746753 }

type LocationSpec = {
  code: string
  name: string
  kind: LocationKind
  isDefault: boolean
  /** An existing location, by name, to convert instead of creating a new one. */
  adopt?: string
  address_2?: string
}

const LOCATIONS: LocationSpec[] = [
  {
    code: "DM",
    name: "Daan Mogot Storage",
    kind: "warehouse",
    isDefault: true,
    adopt: "Gudang Jakarta",
  },
  {
    code: "FF001",
    name: "Fisik Football Daan Mogot",
    kind: "store",
    isDefault: false,
    address_2: "Lantai 2, Duri Kepa, Kebon Jeruk",
  },
  {
    code: "FS001",
    name: "Factory Outlet Daan Mogot",
    kind: "store",
    isDefault: false,
  },
]

// Stable pseudo-random number per SKU and location (FNV-1a), so the dummy
// stock is the same on every run and every machine.
const hash = (value: string) => {
  let h = 0x811c9dc5
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Football and futsal SKUs start with SPE101-SPE103, running with SPE104,
// apparel and socks with SPE2 / SPE3.
const isFootball = (sku: string) => /^SPE10[123]/.test(sku)

/** Dummy units for a store; roughly a quarter to a third of sizes are out. */
const dummyStock = (code: string, sku: string) => {
  const h = hash(`${code}:${sku}`)
  if (code === "FF001") {
    // The football store carries boots in depth and a little of everything else.
    return isFootball(sku)
      ? h % 4 === 0
        ? 0
        : 1 + (h % 8)
      : h % 2 === 0
      ? 0
      : 1 + (h % 3)
  }
  // The factory outlet has a few units of whatever it received.
  return h % 3 === 0 ? 0 : 1 + (h % 5)
}

const DEFAULT_WAREHOUSE_STOCK = 40

type LocationRow = {
  id: string
  name: string
  metadata?: Record<string, unknown> | null
  sales_channels?: { id: string }[] | null
  fulfillment_providers?: { id: string }[] | null
  fulfillment_sets?: { id: string; type: string }[] | null
}

export default async function seedOmnichannel({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const inventory = container.resolve(Modules.INVENTORY)
  const reset = (args ?? []).includes("reset")

  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
  })
  const channelIds = channels.map((channel) => channel.id)

  const loadLocations = async () =>
    (
      await query.graph({
        entity: "stock_location",
        fields: [
          "id",
          "name",
          "metadata",
          "sales_channels.id",
          "fulfillment_providers.id",
          "fulfillment_sets.id",
          "fulfillment_sets.type",
        ],
      })
    ).data as LocationRow[]

  let existing = await loadLocations()
  const resolved: Record<string, string> = {}

  for (const spec of LOCATIONS) {
    const metadata = {
      [LOCATION_META.enabled]: true,
      [LOCATION_META.code]: spec.code,
      [LOCATION_META.kind]: spec.kind,
      [LOCATION_META.isDefault]: spec.isDefault,
      [LOCATION_META.latitude]: SPECS_ARENA.latitude,
      [LOCATION_META.longitude]: SPECS_ARENA.longitude,
    }
    const address = { ...ADDRESS, address_2: spec.address_2 ?? ADDRESS.address_2 }

    const byCode = existing.find(
      (location) => location.metadata?.[LOCATION_META.code] === spec.code
    )
    const adopted =
      !byCode && spec.adopt
        ? existing.find((location) => location.name === spec.adopt)
        : undefined

    if (byCode) {
      resolved[spec.code] = byCode.id
      logger.info(`Location ${spec.code} already exists (${byCode.name}).`)
    } else if (adopted) {
      await updateStockLocationsWorkflow(container).run({
        input: {
          selector: { id: adopted.id },
          update: {
            name: spec.name,
            address,
            metadata: { ...(adopted.metadata ?? {}), ...metadata },
          },
        },
      })
      resolved[spec.code] = adopted.id
      logger.info(`Converted "${adopted.name}" into ${spec.code} - ${spec.name}.`)
    } else {
      const { result } = await createStockLocationsWorkflow(container).run({
        input: { locations: [{ name: spec.name, address, metadata }] },
      })
      resolved[spec.code] = result[0].id
      logger.info(`Created ${spec.code} - ${spec.name}.`)
    }
  }

  existing = await loadLocations()

  for (const spec of LOCATIONS) {
    const location = existing.find((entry) => entry.id === resolved[spec.code])!

    const linked = new Set((location.sales_channels ?? []).map((c) => c.id))
    const missing = channelIds.filter((id) => !linked.has(id))
    if (missing.length) {
      await linkSalesChannelsToStockLocationWorkflow(container).run({
        input: { id: location.id, add: missing },
      })
    }

    // Lets the location fulfil orders with the manual provider.
    if (!(location.fulfillment_providers ?? []).some((p) => p.id === "manual_manual")) {
      await link.create({
        [Modules.STOCK_LOCATION]: { stock_location_id: location.id },
        [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
      })
    }
  }

  // Stock: every inventory item gets a level at every omnichannel location.
  const items = await inventory.listInventoryItems({}, { select: ["id", "sku"] })
  const locationIds = Object.values(resolved)
  const levels = await inventory.listInventoryLevels(
    { location_id: locationIds },
    { select: ["id", "inventory_item_id", "location_id", "reserved_quantity"] }
  )
  const levelFor = (itemId: string, locationId: string) =>
    levels.find(
      (level) => level.inventory_item_id === itemId && level.location_id === locationId
    )

  const toCreate: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }[] = []
  const toUpdate: {
    inventory_item_id: string
    location_id: string
    stocked_quantity: number
  }[] = []

  for (const item of items) {
    const sku = item.sku ?? item.id
    for (const spec of LOCATIONS) {
      const locationId = resolved[spec.code]
      const level = levelFor(item.id, locationId)
      const quantity =
        spec.kind === "warehouse" ? DEFAULT_WAREHOUSE_STOCK : dummyStock(spec.code, sku)

      if (!level) {
        toCreate.push({ inventory_item_id: item.id, location_id: locationId, stocked_quantity: quantity })
      } else if (reset && spec.kind === "store") {
        toUpdate.push({
          inventory_item_id: item.id,
          location_id: locationId,
          // Never below what is already reserved at the store.
          stocked_quantity: Math.max(quantity, Number(level.reserved_quantity ?? 0)),
        })
      }
    }
  }

  if (toCreate.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: { inventory_levels: toCreate },
    })
  }
  if (toUpdate.length) {
    await updateInventoryLevelsWorkflow(container).run({
      input: { updates: toUpdate },
    })
  }

  const pickupCreated = await ensurePickupOptions(container, resolved)

  logger.info(
    `Omnichannel seed done: ${LOCATIONS.length} location(s), ${toCreate.length} stock level(s) created, ${toUpdate.length} reset, ${pickupCreated} pickup option(s) created.`
  )
}

// A pickup fulfillment set, service zone and free shipping option per store.
// The option's price rule is per region, so it is created for every region
// selling in IDR (the SPECS shops).
const ensurePickupOptions = async (
  container: ExecArgs["container"],
  resolved: Record<string, string>
) => {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "type"],
  })
  const profile = profiles.find((entry) => entry.type === "default") ?? profiles[0]
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"],
  })
  const idrRegions = regions.filter((region) => region.currency_code === "idr")

  if (!profile || !idrRegions.length) {
    logger.warn("No shipping profile or IDR region found; pickup options skipped.")
    return 0
  }

  type PickupSet = {
    id: string
    type: string
    service_zones?: { id: string; shipping_options?: { id: string }[] | null }[] | null
  }
  const pickupSetOf = async (locationId: string) => {
    const { data } = await query.graph({
      entity: "stock_location",
      fields: [
        "fulfillment_sets.id",
        "fulfillment_sets.type",
        "fulfillment_sets.service_zones.id",
        "fulfillment_sets.service_zones.shipping_options.id",
      ],
      filters: { id: locationId },
    })
    return ((data[0] as { fulfillment_sets?: PickupSet[] } | undefined)?.fulfillment_sets ?? []).find(
      (set) => set.type === "pickup"
    )
  }

  let created = 0
  for (const spec of LOCATIONS.filter((entry) => entry.kind === "store")) {
    const locationId = resolved[spec.code]

    // Reuse a pickup set created from the admin ("Enable pickup" on the
    // location page); only create one when the location has none.
    let set = await pickupSetOf(locationId)
    if (!set) {
      await createLocationFulfillmentSetWorkflow(container).run({
        input: {
          location_id: locationId,
          fulfillment_set_data: { name: `${spec.name} pickup`, type: "pickup" },
        },
      })
      set = await pickupSetOf(locationId)
    }
    if (!set) {
      logger.warn(`Could not create a pickup fulfillment set for ${spec.code}.`)
      continue
    }
    if ((set.service_zones ?? []).some((zone) => (zone.shipping_options ?? []).length)) {
      continue
    }

    let zoneId = set.service_zones?.[0]?.id
    if (!zoneId) {
      const { result: zones } = await createServiceZonesWorkflow(container).run({
        input: {
          data: [
            {
              fulfillment_set_id: set.id,
              name: `${spec.code} pickup`,
              geo_zones: [{ type: "country", country_code: "id" }],
            },
          ],
        },
      })
      zoneId = zones[0].id
    }

    await createShippingOptionsWorkflow(container).run({
      input: [
        {
          name: `Ambil di ${spec.name}`,
          price_type: "flat",
          provider_id: "manual_manual",
          service_zone_id: zoneId,
          shipping_profile_id: profile.id,
          type: {
            label: "Ambil di toko",
            description: "Ambil sendiri di toko, gratis.",
            code: `pickup-${spec.code.toLowerCase()}`,
          },
          prices: idrRegions.map((region) => ({ region_id: region.id, amount: 0 })),
          rules: [
            { attribute: "enabled_in_store", value: "true", operator: "eq" },
            { attribute: "is_return", value: "false", operator: "eq" },
          ],
        },
      ],
    })
    created++
    logger.info(`Created the pickup option for ${spec.code} - ${spec.name}.`)
  }
  return created
}
