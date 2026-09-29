import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminOrder, DetailWidgetProps } from "@medusajs/framework/types"
import { Badge, Container, Heading, Text } from "@medusajs/ui"
import { useQuery } from "@tanstack/react-query"
import { sdk } from "../lib/sdk"

type OrderLine = {
  id: string
  title: string
  variant_title?: string | null
  quantity: number
  metadata?: Record<string, unknown> | null
}

/**
 * Where each item of the order ships from: the location the shopper picked on
 * the storefront, and where its stock is actually reserved. Fulfil each item
 * from the location shown here.
 */
const OrderShipFromWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const { data: details } = useQuery({
    queryKey: ["order-ship-from", data.id],
    queryFn: async () => {
      const { order } = await sdk.admin.order.retrieve(data.id, {
        fields: "id,items.id,items.title,items.variant_title,items.quantity,items.metadata",
      })
      const items = (order.items ?? []) as OrderLine[]
      const [{ reservations }, { stock_locations }] = await Promise.all([
        items.length
          ? sdk.admin.reservation.list({
              line_item_id: items.map((item) => item.id),
              limit: 200,
            } as Record<string, unknown>)
          : Promise.resolve({ reservations: [] }),
        sdk.admin.stockLocation.list({ fields: "id,name,metadata", limit: 200 }),
      ])
      return { items, reservations, locations: stock_locations }
    },
  })

  const items = details?.items ?? []
  const chosen = items.filter((item) => typeof item.metadata?.stock_location_id === "string")

  if (!chosen.length) {
    return null
  }

  const locationLabel = (id?: string | null) => {
    const location = details?.locations.find((entry) => entry.id === id)
    if (!location) {
      return id ?? "-"
    }
    const code = (location.metadata as Record<string, unknown> | null)?.location_code
    return code ? `${location.name} (${code})` : location.name
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading level="h2">
          {chosen.every((item) => item.metadata?.fulfillment_type === "pickup")
            ? "Pickup at store"
            : "Ship from"}
        </Heading>
        <Text size="small" className="text-ui-fg-subtle">
          Locations picked by the shopper. Fulfil each item from its location;
          pickup items are handed over at that store.
        </Text>
      </div>
      <div className="flex flex-col gap-y-3 px-6 py-4">
        {chosen.map((item) => {
          const chosenId = item.metadata?.stock_location_id as string
          const reserved = (details?.reservations ?? []).filter(
            (reservation) => reservation.line_item_id === item.id
          )
          const mismatch = reserved.some((reservation) => reservation.location_id !== chosenId)

          return (
            <div key={item.id} className="flex flex-col gap-y-1">
              <div className="flex items-start justify-between gap-x-2">
                <Text size="small" weight="plus" className="line-clamp-1">
                  {item.quantity}x {item.title}
                </Text>
                {mismatch && (
                  <Badge size="2xsmall" color="orange">
                    Reserved elsewhere
                  </Badge>
                )}
              </div>
              {item.variant_title && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  {item.variant_title}
                </Text>
              )}
              <Text size="xsmall">
                {item.metadata?.fulfillment_type === "pickup" ? "Pickup at " : "Ship from "}
                {locationLabel(chosenId)}
              </Text>
              {mismatch && (
                <Text size="xsmall" className="text-ui-fg-subtle">
                  Stock reserved at{" "}
                  {reserved.map((reservation) => locationLabel(reservation.location_id)).join(", ")}
                  : the chosen location had too little stock when the order was placed.
                </Text>
              )}
            </div>
          )
        })}
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.after",
})

export default OrderShipFromWidget
