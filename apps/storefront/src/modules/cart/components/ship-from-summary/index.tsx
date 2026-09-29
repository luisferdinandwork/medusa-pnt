import {
  cartFulfillment,
  lineLocationId,
  locationKindLabel,
  type OmnichannelData,
} from "@lib/util/omnichannel"
import { HttpTypes } from "@medusajs/types"
import LocationKindIcon from "@modules/common/icons/location-kind"

/**
 * Where the bag ships from: each stock location with the number of items
 * leaving it. Items from different locations travel as separate parcels.
 */
export default function ShipFromSummary({
  cart,
  omnichannel,
}: {
  cart: HttpTypes.StoreCart
  omnichannel?: OmnichannelData
}) {
  const locations = omnichannel?.locations ?? []
  // A pickup bag's store is shown by the "Cara terima" choice instead.
  if (
    !locations.length ||
    !cart.items?.length ||
    cartFulfillment(cart.items, locations).mode === "pickup"
  ) {
    return null
  }

  const counts = new Map<string, number>()
  for (const item of cart.items) {
    const id = lineLocationId(item.metadata, locations)
    if (id) {
      counts.set(id, (counts.get(id) ?? 0) + item.quantity)
    }
  }
  const used = locations.filter((location) => counts.has(location.id))

  return (
    <div className="flex flex-col gap-y-3" data-testid="ship-from-summary">
      <span className="text-xs font-semibold uppercase tracking-widest text-ink-500">
        Dikirim dari
      </span>
      <ul className="flex flex-col gap-y-2">
        {used.map((location) => (
          <li key={location.id} className="flex items-start justify-between gap-x-3">
            <span className="flex items-start gap-x-2">
              <span className="mt-0.5">
                <LocationKindIcon kind={location.kind} />
              </span>
              <span className="flex flex-col">
                <span className="text-small-regular font-semibold text-ink">
                  {location.name}
                </span>
                <span className="text-xs text-ink-500">
                  {locationKindLabel(location)} {location.code}
                  {location.address?.address_1 && ` · ${location.address.address_1}`}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-xs text-ink-500">
              {counts.get(location.id)} produk
            </span>
          </li>
        ))}
      </ul>
      {used.length > 1 && (
        <p className="text-xs text-ink-500">
          Produk dari lokasi yang berbeda dikirim dalam paket terpisah.
        </p>
      )}
    </div>
  )
}
