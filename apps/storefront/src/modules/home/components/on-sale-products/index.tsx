import { listProducts } from "@lib/data/products"
import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

const SHOWN = 4
const SCANNED = 60

/**
 * Products with a sale price right now (set in the admin under Products >
 * Prices & sales), biggest discount first. Hidden when nothing is on sale.
 */
export default async function OnSaleProducts({
  region,
}: {
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products },
  } = await listProducts({
    regionId: region.id,
    queryParams: { limit: SCANNED, order: "-created_at" },
  })

  const onSale = products
    .map((product) => ({ product, price: getProductPrice({ product }).cheapestPrice }))
    .filter(({ price }) => price?.price_type === "sale")
    .sort(
      (a, b) =>
        Number(b.price?.percentage_diff ?? 0) - Number(a.price?.percentage_diff ?? 0)
    )
    .slice(0, SHOWN)

  if (!onSale.length) {
    return null
  }

  return (
    <section className="bg-paper-100 py-12 small:py-16">
      <div className="content-container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
              Lagi diskon
            </span>
            <h2 className="font-display mt-1 text-3xl uppercase small:text-4xl">
              Harga turun, stok terbatas
            </h2>
          </div>
          <LocalizedClientLink
            href="/store"
            className="shrink-0 text-xs font-semibold uppercase tracking-widest text-ink-500 transition-colors hover:text-red-500"
          >
            Lihat semua &rarr;
          </LocalizedClientLink>
        </div>
        <ul className="grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-4 small:gap-x-6">
          {onSale.map(({ product }) => (
            <li key={product.id}>
              <ProductPreview product={product} region={region} />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
