import { HttpTypes } from "@medusajs/types"
import { formatRupiah } from "@/lib/format"
import type { ShippingOption } from "@/lib/data/cart"

type Price = {
  amount: number
  currency_code: string
  price_rules?: { attribute: string; operator: string; value: string }[]
}

// Finds a shipping price of 0 that unlocks at a cart item_total threshold
// (e.g. "free shipping above Rp 500.000") and shows progress toward it.
export function FreeShippingNudge({
  cart,
  options,
}: {
  cart: HttpTypes.StoreCart
  options: ShippingOption[]
}) {
  const prices = options.flatMap((option) => (option as { prices?: Price[] }).prices ?? [])

  const freePrice = prices.find(
    (price) =>
      price.amount === 0 &&
      price.currency_code === cart.currency_code &&
      price.price_rules?.some(
        (rule) => rule.attribute === "item_total" && (rule.operator === "gte" || rule.operator === "gt")
      )
  )
  if (!freePrice) return null

  const rule = freePrice.price_rules!.find((r) => r.attribute === "item_total")!
  const threshold = Number(rule.value) + (rule.operator === "gt" ? 1 : 0)
  const current = cart.item_total ?? 0
  const reached = current >= threshold
  const percent = Math.min(100, Math.round((current / threshold) * 100))

  return (
    <div className="rounded border border-paper-200 bg-white p-3 text-sm" data-testid="free-shipping-nudge">
      <p>
        {reached ? (
          <span className="font-semibold">Selamat, pesanan Anda gratis ongkos kirim.</span>
        ) : (
          <>
            Tambah <span className="font-semibold">{formatRupiah(threshold - current, cart.currency_code)}</span> lagi
            untuk gratis ongkos kirim.
          </>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-200">
        <div className="h-full bg-brand" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
