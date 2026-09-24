import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import ProductCard, { ColorOption } from "./product-card"

const LOW_STOCK_THRESHOLD = 5
const NEW_WITHIN_DAYS = 30

type StoredColorSibling = {
  handle?: string
  label?: string
  hex?: string
  image?: string
}

export default async function ProductPreview({
  product,
  isFeatured: _isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({
    product,
  })

  const totalInventory = (
    (product.variants || []) as (HttpTypes.StoreProductVariant & {
      inventory_quantity?: number
    })[]
  ).reduce((sum, v) => sum + (v.inventory_quantity ?? Infinity), 0)
  const isLowStock =
    Number.isFinite(totalInventory) && totalInventory > 0 && totalInventory <= LOW_STOCK_THRESHOLD

  const isNew =
    !!product.created_at &&
    Date.now() - new Date(product.created_at).getTime() <
      NEW_WITHIN_DAYS * 24 * 60 * 60 * 1000

  const metadata = (product.metadata ?? {}) as Record<string, unknown>
  const rawSiblings = Array.isArray(metadata.color_siblings)
    ? (metadata.color_siblings as StoredColorSibling[])
    : []
  const ownSwatch =
    typeof metadata.color_swatch === "string" ? metadata.color_swatch : null

  const colors: ColorOption[] =
    rawSiblings.length && ownSwatch
      ? [
          {
            handle: product.handle ?? "",
            label: "Warna ini",
            hex: ownSwatch,
            image: product.thumbnail,
          },
          ...rawSiblings
            .filter((s) => s.handle && s.hex)
            .map((s) => ({
              handle: s.handle!,
              label: s.label ?? "Warna lain",
              hex: s.hex!,
              image: s.image ?? null,
            })),
        ]
      : []

  return (
    <ProductCard
      handle={product.handle ?? ""}
      title={product.title}
      image={product.thumbnail}
      colors={colors}
      price={cheapestPrice}
      isNew={isNew}
      lowStock={isLowStock ? totalInventory : undefined}
    />
  )
}
