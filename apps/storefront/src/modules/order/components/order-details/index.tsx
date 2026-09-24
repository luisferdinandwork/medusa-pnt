import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"

type OrderDetailsProps = {
  order: HttpTypes.StoreOrder
  showStatus?: boolean
}

const FULFILLMENT_STATUS_LABELS: Record<string, string> = {
  not_fulfilled: "Belum diproses",
  partially_fulfilled: "Diproses sebagian",
  fulfilled: "Diproses",
  partially_shipped: "Dikirim sebagian",
  shipped: "Dikirim",
  partially_delivered: "Diterima sebagian",
  delivered: "Diterima",
  canceled: "Dibatalkan",
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  not_paid: "Belum dibayar",
  awaiting: "Menunggu pembayaran",
  captured: "Lunas",
  partially_captured: "Dibayar sebagian",
  refunded: "Dana dikembalikan",
  partially_refunded: "Sebagian dana dikembalikan",
  canceled: "Dibatalkan",
  requires_action: "Perlu tindakan",
}

const OrderDetails = ({ order, showStatus }: OrderDetailsProps) => {
  const formatStatus = (str: string, labels: Record<string, string>) => {
    if (labels[str]) {
      return labels[str]
    }

    const formatted = str.split("_").join(" ")

    return formatted.slice(0, 1).toUpperCase() + formatted.slice(1)
  }

  return (
    <div>
      <Text>
        Kami telah mengirim detail konfirmasi pesanan ke{" "}
        <span
          className="text-ui-fg-medium-plus font-semibold"
          data-testid="order-email"
        >
          {order.email}
        </span>
        .
      </Text>
      <Text className="mt-2">
        Tanggal pesanan:{" "}
        <span data-testid="order-date">
          {new Date(order.created_at).toLocaleDateString("id-ID")}
        </span>
      </Text>
      <Text className="mt-2 text-red-500">
        Nomor pesanan: <span data-testid="order-id">{order.display_id}</span>
      </Text>

      <div className="flex items-center text-compact-small gap-x-4 mt-4">
        {showStatus && (
          <>
            <Text>
              Status pesanan:{" "}
              <span className="text-ui-fg-subtle " data-testid="order-status">
                {formatStatus(order.fulfillment_status, FULFILLMENT_STATUS_LABELS)}
              </span>
            </Text>
            <Text>
              Status pembayaran:{" "}
              <span
                className="text-ui-fg-subtle "
                sata-testid="order-payment-status"
              >
                {formatStatus(order.payment_status, PAYMENT_STATUS_LABELS)}
              </span>
            </Text>
          </>
        )}
      </div>
    </div>
  )
}

export default OrderDetails
