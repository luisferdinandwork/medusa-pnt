import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { CartTotals } from "@/components/cart-totals"
import { FreeShippingNudge } from "@/components/free-shipping-nudge"
import { PromoCode } from "@/components/promo-code"
import { removeItem, updateItem } from "@/lib/actions/cart"
import { getCart, listShippingOptions } from "@/lib/data/cart"
import { formatRupiah } from "@/lib/format"

export const metadata: Metadata = { title: "Keranjang" }

export default async function KeranjangPage() {
  const cart = await getCart()
  const items = cart?.items ?? []

  if (!cart || items.length === 0) {
    return (
      <div className="py-16 text-center">
        <h1 className="font-display text-3xl uppercase">Keranjang kosong</h1>
        <p className="mt-2 text-ink-500">Belum ada produk di keranjang Anda.</p>
        <Link href="/" className="btn mt-6">Lihat katalog</Link>
      </div>
    )
  }

  const currency = cart.currency_code
  const codes = (cart.promotions ?? []).map((p) => p.code).filter((c): c is string => !!c)
  const shippingOptions = await listShippingOptions(cart.id).catch(() => [])

  return (
    <>
      <h1 className="mb-6 font-display text-3xl uppercase">Keranjang</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-paper-200 rounded-lg border border-paper-200 bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 p-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded bg-paper">
                {item.thumbnail && <Image src={item.thumbnail} alt={item.product_title ?? ""} fill sizes="80px" className="object-contain" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">{item.product_title}</p>
                <p className="text-xs text-ink-500">{item.variant_title}</p>
                <p className="mt-1 text-sm">{formatRupiah(item.unit_price, currency)} / pcs</p>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <form action={updateItem} className="flex items-center gap-2">
                    <input type="hidden" name="line_id" value={item.id} />
                    <input type="number" name="quantity" min={1} defaultValue={item.quantity} aria-label="Jumlah" className="input w-20" />
                    <button type="submit" className="btn-outline">Perbarui</button>
                  </form>
                  <form action={removeItem}>
                    <input type="hidden" name="line_id" value={item.id} />
                    <button type="submit" className="text-xs font-semibold text-ink-500 underline hover:text-brand">Hapus</button>
                  </form>
                </div>
              </div>
              <p className="text-sm font-bold">{formatRupiah(item.total, currency)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-lg border border-paper-200 bg-white p-5">
          <h2 className="font-bold">Ringkasan</h2>
          <FreeShippingNudge cart={cart} options={shippingOptions} />
          <PromoCode codes={codes} />
          <div className="border-t border-paper-200 pt-4">
            <CartTotals cart={cart} />
          </div>
          <Link href="/checkout" className="btn w-full" data-testid="checkout-button">Lanjut ke checkout</Link>
        </aside>
      </div>
    </>
  )
}
