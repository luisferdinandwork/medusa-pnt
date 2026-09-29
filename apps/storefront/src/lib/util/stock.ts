/**
 * Stock rules for a variant as a whole. Per-location stock (omnichannel) lives
 * in `./omnichannel`; these cover the product page when no location data could
 * be loaded, and recognising Medusa's stock error.
 */

export type VariantStock = {
  id: string
  manage_inventory?: boolean | null
  allow_backorder?: boolean | null
  inventory_quantity?: number | null
}

/** How many units can be bought in total, or null when there is no limit. */
export const purchaseLimit = (stock?: VariantStock | null): number | null => {
  if (!stock || !stock.manage_inventory || stock.allow_backorder) {
    return null
  }
  return Math.max(0, stock.inventory_quantity ?? 0)
}

/** Units that can still be added on top of what is already in the cart. */
export const remainingToAdd = (limit: number | null, inCart: number) =>
  limit === null ? Infinity : Math.max(0, limit - inCart)

/**
 * Medusa answers with this message (HTTP 400, code "insufficient_inventory")
 * when a cart would hold more of a variant than its locations have. The JS SDK
 * only keeps the message, so it is matched on the text.
 */
export const isInsufficientInventoryError = (error: unknown) =>
  error instanceof Error &&
  /does not have the required inventory/i.test(error.message)
