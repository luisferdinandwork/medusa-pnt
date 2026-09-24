import { HttpTypes } from "@medusajs/types"
import { formatRupiah } from "@/lib/format"

export function CartTotals({ cart }: { cart: HttpTypes.StoreCart }) {
  const currency = cart.currency_code
  const hasShipping = (cart.shipping_methods?.length ?? 0) > 0
  // Present at runtime; missing from the SDK's StoreCart type.
  const discount = (cart as { discount_subtotal?: number }).discount_subtotal ?? 0

  return (
    <dl className="space-y-2 text-sm">
      <div className="flex justify-between">
        <dt>Subtotal</dt>
        <dd data-testid="cart-subtotal">{formatRupiah(cart.item_subtotal, currency)}</dd>
      </div>
      {!!discount && (
        <div className="flex justify-between">
          <dt>Diskon</dt>
          <dd className="text-brand-700" data-testid="cart-discount">
            - {formatRupiah(discount, currency)}
          </dd>
        </div>
      )}
      <div className="flex justify-between">
        <dt>Ongkos kirim</dt>
        <dd data-testid="cart-shipping">
          {hasShipping
            ? cart.shipping_subtotal
              ? formatRupiah(cart.shipping_subtotal, currency)
              : "Gratis"
            : "Dipilih di checkout"}
        </dd>
      </div>
      <div className="flex justify-between">
        <dt>Pajak</dt>
        <dd data-testid="cart-taxes">{formatRupiah(cart.tax_total, currency)}</dd>
      </div>
      <div className="flex justify-between border-t border-paper-200 pt-3 text-base font-bold">
        <dt>Total</dt>
        <dd data-testid="cart-total">{formatRupiah(cart.total, currency)}</dd>
      </div>
    </dl>
  )
}
