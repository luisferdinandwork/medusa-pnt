import type { Metadata } from "next"
import Link from "next/link"
import { formatRupiah, formatTanggal } from "@/lib/format"
import { listOrders, statusPesanan } from "@/lib/data/orders"

export const metadata: Metadata = { title: "Pesanan" }

export default async function PesananPage() {
  const orders = await listOrders()

  return (
    <>
      <h1 className="mb-6 font-display text-3xl uppercase">Riwayat Pesanan</h1>

      {orders.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-ink-500">Anda belum memiliki pesanan.</p>
          <Link href="/" className="btn mt-6">Lihat katalog</Link>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-paper-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-paper-200 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">No. pesanan</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-paper-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-paper">
                  <td className="px-4 py-3 font-semibold">
                    <Link href={`/pesanan/${order.id}`} className="hover:text-brand">#{order.display_id}</Link>
                  </td>
                  <td className="px-4 py-3">{formatTanggal(order.created_at)}</td>
                  <td className="px-4 py-3">{statusPesanan(order.status)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatRupiah(order.total, order.currency_code)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
