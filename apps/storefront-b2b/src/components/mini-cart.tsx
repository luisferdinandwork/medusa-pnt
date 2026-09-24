import Image from "next/image"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { formatRupiah } from "@/lib/format"

// Nav cart link with a hover/focus dropdown previewing the cart, like the
// SPECS cart dropdown. On touch devices the link goes straight to the cart.
export function MiniCart({ cart }: { cart: HttpTypes.StoreCart | null }) {
  const items = cart?.items ?? []
  const count = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div className="group relative">
      <Link href="/keranjang" className="hover:text-brand" data-testid="nav-cart">
        Keranjang ({count})
      </Link>

      <div className="invisible absolute right-0 top-full z-50 w-80 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100 max-sm:hidden">
        <div className="rounded-lg border border-paper-200 bg-white p-4 text-left text-sm normal-case tracking-normal text-ink shadow-lg">
          {items.length === 0 ? (
            <p className="py-4 text-center text-ink-500">Keranjang Anda kosong.</p>
          ) : (
            <>
              <ul className="max-h-64 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-paper">
                      {item.thumbnail && (
                        <Image src={item.thumbnail} alt={item.product_title ?? ""} fill sizes="48px" className="object-contain" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="line-clamp-1 font-semibold">{item.product_title}</p>
                      <p className="text-xs text-ink-500">
                        {item.variant_title} &times; {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">{formatRupiah(item.total, cart?.currency_code)}</p>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-paper-200 pt-3 font-bold">
                <span>Subtotal</span>
                <span>{formatRupiah(cart?.item_subtotal, cart?.currency_code)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link href="/keranjang" className="btn-outline">Lihat keranjang</Link>
                <Link href="/checkout" className="btn !px-3">Checkout</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
