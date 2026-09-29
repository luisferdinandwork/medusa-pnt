import { HttpTypes } from "@medusajs/types"
import { Heading, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

/** Collection and title, at the top of the buy panel. */
const ProductInfo = ({ product }: ProductInfoProps) => {
  return (
    <div id="product-info" className="flex flex-col gap-y-2">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="w-fit text-xs font-semibold uppercase tracking-widest text-ink-500 hover:text-red-500"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}
      <Heading
        level="h1"
        display
        className="text-2xl small:text-3xl leading-tight"
        data-testid="product-title"
      >
        {product.title}
      </Heading>
    </div>
  )
}

/** The product description, below the add to cart button. */
export const ProductDescription = ({ product }: ProductInfoProps) =>
  product.description ? (
    <Text
      className="text-small-regular text-ink-500 whitespace-pre-line leading-relaxed"
      data-testid="product-description"
    >
      {product.description}
    </Text>
  ) : null

export default ProductInfo
