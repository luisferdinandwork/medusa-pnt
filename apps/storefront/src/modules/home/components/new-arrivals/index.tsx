import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import { Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function NewArrivals({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      limit: 8,
      order: "-created_at",
      fields: "*variants.calculated_price,+variants.inventory_quantity",
    },
  })

  if (!products.length) {
    return null
  }

  return (
    <div className="content-container py-16 small:py-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <Text className="text-xs font-semibold uppercase tracking-widest text-red-500">
            Baru datang
          </Text>
          <h2 className="font-display uppercase text-3xl mt-1">
            Minggu ini di rak
          </h2>
        </div>
        <LocalizedClientLink
          href="/store"
          className="text-small-regular font-semibold uppercase tracking-wide text-ink hover:text-red-500"
        >
          Semua produk baru →
        </LocalizedClientLink>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-4 gap-x-6 gap-y-10">
        {products.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} isFeatured />
          </li>
        ))}
      </ul>
    </div>
  )
}
