import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"
import { EMPTY_OMNICHANNEL, type OmnichannelData } from "@lib/util/omnichannel"

import Item from "@modules/cart/components/item"
import SkeletonCartItem from "@modules/skeletons/components/skeleton-cart-item"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
  omnichannel?: OmnichannelData
}

const ItemsTemplate = ({
  cart,
  omnichannel = EMPTY_OMNICHANNEL,
}: ItemsTemplateProps) => {
  const items = cart?.items

  return (
    <div>
      <div className="flex items-center justify-between pb-6">
        <h1 className="font-display uppercase text-3xl">Tas Belanja</h1>
        {!!items?.length && (
          <span className="text-ink-500 txt-medium">
            {items.length} produk
          </span>
        )}
      </div>
      <div>
        {items
          ? items
              .sort((a, b) => {
                return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
              })
              .map((item) => {
                return (
                  <Item
                    key={item.id}
                    item={item}
                    currencyCode={cart?.currency_code}
                    omnichannel={omnichannel}
                    cartItems={items}
                  />
                )
              })
          : repeat(5).map((i) => {
              return <SkeletonCartItem key={i} />
            })}
      </div>
    </div>
  )
}

export default ItemsTemplate
