"use client"

import { Button } from "@modules/common/components/ui"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex flex-col gap-y-4 w-full">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="w-full flex flex-col items-center text-center gap-y-4 py-12"
      data-testid="no-orders-container"
    >
      <h2 className="font-display uppercase text-xl">Belum ada pesanan</h2>
      <p className="text-base-regular text-ink-500">
        Kamu belum punya pesanan - yuk mulai belanja.
      </p>
      <div className="mt-2">
        <LocalizedClientLink href="/store" passHref>
          <Button data-testid="continue-shopping-button">
            Lanjut belanja
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderOverview
