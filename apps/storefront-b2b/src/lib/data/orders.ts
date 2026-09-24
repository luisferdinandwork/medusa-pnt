import "server-only"
import { sdk } from "@/lib/sdk"
import { getAuthHeaders } from "@/lib/cookies"
import { paymentTitle } from "@/lib/checkout"

export async function listOrders() {
  const { orders } = await sdk.store.order.list(
    { limit: 50, order: "-created_at" },
    await getAuthHeaders()
  )
  return orders
}

export async function getOrder(id: string) {
  return sdk.store.order
    .retrieve(
      id,
      {
        fields:
          "*items,*shipping_address,*billing_address,*shipping_methods,*payment_collections,*payment_collections.payments",
      },
      await getAuthHeaders()
    )
    .then(({ order }) => order)
    .catch(() => null)
}

const STATUS: Record<string, string> = {
  pending: "Menunggu diproses",
  completed: "Selesai",
  canceled: "Dibatalkan",
  requires_action: "Perlu tindakan",
  archived: "Diarsipkan",
}

export const statusPesanan = (s: string) => STATUS[s] ?? s

const PAYMENT_STATUS: Record<string, string> = {
  not_paid: "Belum dibayar",
  awaiting: "Menunggu pembayaran",
  authorized: "Terotorisasi",
  partially_authorized: "Sebagian terotorisasi",
  captured: "Lunas",
  partially_captured: "Sebagian lunas",
  partially_refunded: "Sebagian dikembalikan",
  refunded: "Dikembalikan",
  canceled: "Dibatalkan",
  requires_action: "Perlu tindakan",
}

export const statusPembayaran = (s: string) => PAYMENT_STATUS[s] ?? s

export function orderPaymentMethod(order: NonNullable<Awaited<ReturnType<typeof getOrder>>>) {
  const providerId = order.payment_collections?.[0]?.payments?.[0]?.provider_id
  return providerId ? paymentTitle(providerId) : null
}
