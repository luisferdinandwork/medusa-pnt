import { Button } from "@modules/common/components/ui"
import { useMemo } from "react"

import Thumbnail from "@modules/products/components/thumbnail"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type OrderCardProps = {
  order: HttpTypes.StoreOrder
}

const OrderCard = ({ order }: OrderCardProps) => {
  const numberOfLines = useMemo(() => {
    return (
      order.items?.reduce((acc, item) => {
        return acc + item.quantity
      }, 0) ?? 0
    )
  }, [order])

  const numberOfProducts = useMemo(() => {
    return order.items?.length ?? 0
  }, [order])

  return (
    <div
      className="rounded-large border border-paper-200 p-5 flex flex-col"
      data-testid="order-card"
    >
      <div className="flex flex-col xsmall:flex-row xsmall:items-center justify-between gap-2 mb-4">
        <div className="font-display uppercase text-xl">
          #<span data-testid="order-display-id">{order.display_id}</span>
        </div>
        <div className="flex items-center divide-x divide-paper-200 text-small-regular text-ink-500">
          <span className="pr-2" data-testid="order-created-at">
            {new Date(order.created_at).toLocaleDateString("id-ID")}
          </span>
          <span className="px-2 font-semibold text-ink" data-testid="order-amount">
            {convertToLocale({
              amount: order.total,
              currency_code: order.currency_code,
            })}
          </span>
          <span className="pl-2">{numberOfLines} produk</span>
        </div>
      </div>
      <div className="grid grid-cols-2 small:grid-cols-4 gap-4 mb-4">
        {order.items?.slice(0, 3).map((i) => {
          return (
            <div
              key={i.id}
              className="flex flex-col gap-y-2"
              data-testid="order-item"
            >
              <Thumbnail thumbnail={i.thumbnail} images={[]} size="full" />
              <div className="flex items-center text-small-regular text-ink-500">
                <span
                  className="text-ink font-semibold truncate"
                  data-testid="item-title"
                >
                  {i.title}
                </span>
                <span className="ml-2 shrink-0">x</span>
                <span className="shrink-0" data-testid="item-quantity">{i.quantity}</span>
              </div>
            </div>
          )
        })}
        {numberOfProducts > 4 && (
          <div className="w-full h-full flex flex-col items-center justify-center text-ink-500">
            <span className="text-small-regular">
              + {numberOfLines - 4}
            </span>
            <span className="text-small-regular">lainnya</span>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <LocalizedClientLink href={`/account/orders/details/${order.id}`}>
          <Button data-testid="order-details-link" variant="secondary">
            Lihat detail
          </Button>
        </LocalizedClientLink>
      </div>
    </div>
  )
}

export default OrderCard
