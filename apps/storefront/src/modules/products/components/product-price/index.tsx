import { clx } from "@modules/common/components/ui"

import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="block w-32 h-9 bg-paper-100 animate-pulse" />
  }

  return (
    <div className="flex items-center gap-x-3 flex-wrap">
      <span
        className={clx("font-display text-2xl", {
          "text-red-500": selectedPrice.price_type === "sale",
          "text-ink": selectedPrice.price_type !== "sale",
        })}
      >
        {!variant && "Mulai "}
        <span
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
      </span>
      {selectedPrice.price_type === "sale" && (
        <>
          <span
            className="line-through text-ink-500/50"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
          <span className="rounded-full bg-red-50 text-red-600 text-xs font-semibold px-2 py-1">
            Hemat {selectedPrice.percentage_diff}%
          </span>
        </>
      )}
    </div>
  )
}
