import type { InventoryTypes } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MathBN,
  Modules,
} from "@medusajs/framework/utils"
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  lineItemLocationId,
  listOmnichannelLocations,
} from "../../lib/omnichannel"

type PlanReservationMovesInput = { order_id: string }

export type SkippedMove = {
  line_item_id: string
  location_id: string
  reason: string
}

type OrderLine = {
  id: string
  title: string
  metadata?: Record<string, unknown> | null
}

// Medusa reserves an order's stock at the first sales channel location with
// enough units. This step works out which reservations have to move to the
// location the shopper picked (or, for lines without one, to the store of a
// pickup shipping option), and skips a move when that location no longer has
// the units (the reservation then stays where Medusa put it).
export const planReservationMovesStep = createStep(
  "plan-reservation-moves",
  async ({ order_id }: PlanReservationMovesInput, { container }) => {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const inventory = container.resolve(Modules.INVENTORY)

    const { data } = await query.graph({
      entity: "order",
      fields: [
        "id",
        "items.id",
        "items.title",
        "items.metadata",
        "shipping_methods.shipping_option_id",
      ],
      filters: { id: order_id },
    })
    const order = data[0] as
      | {
          items?: OrderLine[]
          shipping_methods?: { shipping_option_id?: string | null }[] | null
        }
      | undefined

    // A pickup order is collected at the pickup option's store.
    let pickupLocationId: string | undefined
    const optionId = order?.shipping_methods?.at(-1)?.shipping_option_id
    if (optionId) {
      const { data: options } = await query.graph({
        entity: "shipping_option",
        fields: ["service_zone.fulfillment_set.type", "service_zone.fulfillment_set.location.id"],
        filters: { id: optionId },
      })
      const set = (options[0] as
        | { service_zone?: { fulfillment_set?: { type?: string; location?: { id: string } | null } | null } | null }
        | undefined)?.service_zone?.fulfillment_set
      if (set?.type === "pickup") {
        pickupLocationId = set.location?.id
      }
    }

    const lines = (order?.items ?? [])
      .map((line) => ({
        line,
        locationId: lineItemLocationId(line.metadata) ?? pickupLocationId,
      }))
      .filter(
        (entry): entry is { line: OrderLine; locationId: string } =>
          !!entry.locationId
      )

    const moves: InventoryTypes.UpdateReservationItemInput[] = []
    const skipped: SkippedMove[] = []

    if (!lines.length) {
      return new StepResponse({ moves, skipped })
    }

    const validLocations = new Set(
      (await listOmnichannelLocations(container)).map((location) => location.id)
    )
    const reservations = await inventory.listReservationItems({
      line_item_id: lines.map((entry) => entry.line.id),
    })

    // Units already promised to earlier moves in this order, per
    // "inventory item:location", so two lines can't both claim the last unit.
    const claimed = new Map<string, number>()

    for (const { line, locationId } of lines) {
      for (const reservation of reservations.filter(
        (entry) => entry.line_item_id === line.id
      )) {
        if (reservation.location_id === locationId) {
          continue
        }
        if (!validLocations.has(locationId)) {
          skipped.push({
            line_item_id: line.id,
            location_id: locationId,
            reason: "location is not an omnichannel location",
          })
          continue
        }

        const key = `${reservation.inventory_item_id}:${locationId}`
        const available = await inventory.retrieveAvailableQuantity(
          reservation.inventory_item_id,
          [locationId]
        )
        const free = MathBN.sub(available, claimed.get(key) ?? 0)

        if (MathBN.lt(free, reservation.quantity)) {
          skipped.push({
            line_item_id: line.id,
            location_id: locationId,
            reason: `only ${free.toString()} unit(s) of "${line.title}" free there`,
          })
          continue
        }

        claimed.set(
          key,
          MathBN.add(claimed.get(key) ?? 0, reservation.quantity).toNumber()
        )
        moves.push({ id: reservation.id, location_id: locationId })
      }
    }

    return new StepResponse({ moves, skipped })
  }
)
