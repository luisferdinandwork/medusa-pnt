import { getCartFulfillment, getCartLocationQuantities } from "@lib/data/cart"
import { getOmnichannelAvailability } from "@lib/data/omnichannel"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductActions from "@modules/products/components/product-actions"

/**
 * Fetches real time pricing for a product, the stock of each of its variants
 * at every ship-from location, and how much of each is already in the cart,
 * then renders the product actions component.
 */
export default async function ProductActionsWrapper({
  id,
  region,
}: {
  id: string
  region: HttpTypes.StoreRegion
}) {
  const product = await listProducts({
    queryParams: { id: [id] },
    regionId: region.id,
  }).then(({ response }) => response.products[0])

  if (!product) {
    return null
  }

  // The product list is cached; stock is read live so the page never offers
  // units that are already gone or already in the bag.
  const omnichannel = await getOmnichannelAvailability(
    (product.variants ?? []).map((variant) => variant.id)
  )
  const [cartQuantities, cartMode] = await Promise.all([
    getCartLocationQuantities(omnichannel.locations),
    getCartFulfillment(omnichannel.locations),
  ])

  return (
    <ProductActions
      product={product}
      region={region}
      omnichannel={omnichannel}
      cartQuantities={cartQuantities}
      cartMode={cartMode}
    />
  )
}
