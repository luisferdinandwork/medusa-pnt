import Image from "next/image"
import { HttpTypes } from "@medusajs/types"
import { formatRupiah } from "@/lib/format"
import { CartTotals } from "./cart-totals"
import { PromoCode } from "./promo-code"

// Checkout sidebar: line items, promo code and totals.
export function OrderSummary({ cart }: { cart: HttpTypes.StoreCart }) {
  const codes = (cart.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c)

  return (
    <aside className="h-fit space-y-5 rounded-lg border border-paper-200 bg-white p-5">
      <h2 className="font-bold">Pesanan Anda</h2>
      <ul className="space-y-3 text-sm">
        {cart.items?.map((item) => (
          <li key={item.id} className="flex gap-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-paper">
              {item.thumbnail && (
                <Image src={item.thumbnail} alt={item.product_title ?? ""} fill sizes="56px" className="object-contain" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{item.product_title}</p>
              <p className="text-xs text-ink-500">
                {item.variant_title} &times; {item.quantity}
              </p>
            </div>
            <p className="font-semibold">{formatRupiah(item.total, cart.currency_code)}</p>
          </li>
        ))}
      </ul>
      <div className="border-t border-paper-200 pt-4">
        <PromoCode codes={codes} />
      </div>
      <div className="border-t border-paper-200 pt-4">
        <CartTotals cart={cart} />
      </div>
    </aside>
  )
}
