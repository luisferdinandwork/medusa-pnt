"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { HttpTypes } from "@medusajs/types"
import { addToCart } from "@/lib/actions/cart"
import { formatRupiah } from "@/lib/format"

export function AddToCart({ product }: { product: HttpTypes.StoreProduct }) {
  const variants = product.variants ?? []
  const options = product.options ?? []

  const [selected, setSelected] = useState<Record<string, string>>(() =>
    variants.length === 1
      ? Object.fromEntries((variants[0].options ?? []).map((o) => [o.option_id!, o.value]))
      : {}
  )
  const [quantity, setQuantity] = useState(1)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)
  const [pending, startTransition] = useTransition()

  const variant = useMemo(
    () =>
      variants.find((v) =>
        options.every((opt) => v.options?.some((o) => o.option_id === opt.id && o.value === selected[opt.id]))
      ),
    [variants, options, selected]
  )

  const price = variant?.calculated_price
  const outOfStock =
    !!variant && variant.manage_inventory && !variant.allow_backorder && (variant.inventory_quantity ?? 0) < 1

  function submit() {
    if (!variant) return
    setMessage(null)
    startTransition(async () => {
      const result = await addToCart(variant.id, quantity)
      setMessage(result?.error ? { ok: false, text: result.error } : { ok: true, text: "Ditambahkan ke keranjang." })
    })
  }

  return (
    <div className="space-y-5">
      <p className="text-2xl font-bold">
        {price?.calculated_amount != null ? formatRupiah(price.calculated_amount, price.currency_code ?? "idr") : "Pilih varian untuk melihat harga"}
      </p>

      {options.map((opt) => (
        <div key={opt.id}>
          <p className="label">{opt.title}</p>
          <div className="flex flex-wrap gap-2">
            {(opt.values ?? []).map((v) => {
              const active = selected[opt.id] === v.value
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelected((s) => ({ ...s, [opt.id]: v.value }))}
                  className={`min-w-12 rounded border px-3 py-2 text-sm ${active ? "border-ink bg-ink text-paper" : "border-paper-200 bg-white hover:border-ink"}`}
                >
                  {v.value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div>
        <label htmlFor="qty" className="label">Jumlah (pcs)</label>
        <input
          id="qty"
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value)) || 1))}
          className="input w-28"
        />
      </div>

      <button type="button" className="btn w-full sm:w-auto" disabled={!variant || outOfStock || pending} onClick={submit}>
        {outOfStock ? "Stok habis" : pending ? "Menambahkan..." : "Tambah ke keranjang"}
      </button>

      {message && (
        <p role="status" className={`text-sm ${message.ok ? "text-ink" : "text-brand-700"}`}>
          {message.text}{" "}
          {message.ok && (
            <Link href="/keranjang" className="font-semibold underline">Lihat keranjang</Link>
          )}
        </p>
      )}
    </div>
  )
}
