import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { formatRupiah, formatTanggal } from "@/lib/format"
import { getOrder, orderPaymentMethod, statusPembayaran, statusPesanan } from "@/lib/data/orders"

export const metadata: Metadata = { title: "Detail Pesanan" }

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ baru?: string }>
}

export default async function DetailPesananPage({ params, searchParams }: Props) {
  const [{ id }, { baru }] = await Promise.all([params, searchParams])
  const order = await getOrder(id)
  if (!order) notFound()

  const currency = order.currency_code
  const address = order.shipping_address
  const billing = order.billing_address
  const shippingMethod = order.shipping_methods?.[0]
  const paymentMethod = orderPaymentMethod(order)

  return (
    <>
      <Link href="/pesanan" className="text-sm text-ink-500 hover:text-brand">&larr; Semua pesanan</Link>

      {baru && (
        <div role="status" className="mt-4 rounded border border-ink bg-white p-4 text-sm" data-testid="order-confirmed">
          <p className="font-bold">Terima kasih, pesanan Anda telah kami terima.</p>
          <p className="mt-1 text-ink-500">Tim kami akan mengirim invoice dan instruksi pembayaran ke {order.email}.</p>
        </div>
      )}

      <div className="mb-6 mt-4 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl uppercase">Pesanan #{order.display_id}</h1>
        <p className="text-sm text-ink-500">
          {formatTanggal(order.created_at)} &middot; {statusPesanan(order.status)}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
        <ul className="divide-y divide-paper-200 rounded-lg border border-paper-200 bg-white">
          {(order.items ?? []).map((item) => (
            <li key={item.id} className="flex justify-between gap-4 p-4 text-sm">
              <div>
                <p className="font-semibold">{item.product_title}</p>
                <p className="text-xs text-ink-500">{item.variant_title} &times; {item.quantity}</p>
              </div>
              <p className="font-semibold">{formatRupiah(item.total, currency)}</p>
            </li>
          ))}
        </ul>

        <aside className="h-fit space-y-5 rounded-lg border border-paper-200 bg-white p-5 text-sm">
          <dl className="space-y-2">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatRupiah(order.item_subtotal, currency)}</dd></div>
            {!!order.discount_total && (
              <div className="flex justify-between"><dt>Diskon</dt><dd className="text-brand-700">- {formatRupiah(order.discount_total, currency)}</dd></div>
            )}
            <div className="flex justify-between"><dt>Ongkos kirim</dt><dd>{order.shipping_total ? formatRupiah(order.shipping_total, currency) : "Gratis"}</dd></div>
            <div className="flex justify-between"><dt>Pajak</dt><dd>{formatRupiah(order.tax_total, currency)}</dd></div>
            <div className="flex justify-between border-t border-paper-200 pt-3 text-base font-bold"><dt>Total</dt><dd>{formatRupiah(order.total, currency)}</dd></div>
          </dl>

          {address && (
            <div>
              <h2 className="font-bold">Dikirim ke</h2>
              <address className="mt-1 not-italic text-ink-500">
                {address.first_name} {address.last_name}
                {address.company && <><br />{address.company}</>}
                <br />{address.address_1}
                <br />{address.city}, {address.province} {address.postal_code}
                <br />{address.phone}
              </address>
            </div>
          )}

          {billing && billing.address_1 !== address?.address_1 && (
            <div>
              <h2 className="font-bold">Alamat penagihan</h2>
              <address className="mt-1 not-italic text-ink-500">
                {billing.first_name} {billing.last_name}
                <br />{billing.address_1}
                <br />{billing.city}, {billing.province} {billing.postal_code}
              </address>
            </div>
          )}

          {shippingMethod && (
            <div>
              <h2 className="font-bold">Pengiriman</h2>
              <p className="mt-1 text-ink-500">{shippingMethod.name}</p>
            </div>
          )}

          <div>
            <h2 className="font-bold">Pembayaran</h2>
            <p className="mt-1 text-ink-500">
              {paymentMethod ?? "-"} &middot; {statusPembayaran(order.payment_status)}
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
