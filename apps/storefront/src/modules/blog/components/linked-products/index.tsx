import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import ProductPreview from "@modules/products/components/product-preview"

/**
 * Products an article or a story links to, resolved by handle so the editorial
 * content stays portable between environments.
 */
export default async function LinkedProducts({
  handles,
  countryCode,
  eyebrow,
  title,
}: {
  handles: string[] | null
  countryCode: string
  eyebrow?: string
  title?: string
}) {
  if (!handles?.length) {
    return null
  }

  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const { response } = await listProducts({
    countryCode,
    queryParams: { handle: handles, limit: handles.length },
  })

  if (!response.products.length) {
    return null
  }

  // Keep the order the editor put the products in.
  const ordered = handles
    .map((handle) =>
      response.products.find((product) => product.handle === handle)
    )
    .filter((product): product is NonNullable<typeof product> =>
      Boolean(product)
    )

  return (
    <section className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-1">
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-widest text-red-500">
            {eyebrow}
          </span>
        )}
        <h2 className="font-display uppercase text-2xl small:text-3xl">
          {title ?? "Produk dalam cerita ini"}
        </h2>
      </div>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {ordered.map((product) => (
          <li key={product.id}>
            <ProductPreview product={product} region={region} />
          </li>
        ))}
      </ul>
    </section>
  )
}
