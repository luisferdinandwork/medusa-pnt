import React, { Suspense } from "react"

import ProductStoryTeaser from "@modules/blog/components/product-story-teaser"
import ImageGallery, { type ProductVideo } from "@modules/products/components/image-gallery"
import ProductActions from "@modules/products/components/product-actions"
import ProductOnboardingCta from "@modules/products/components/product-onboarding-cta"
import ProductTabs from "@modules/products/components/product-tabs"
import RelatedProducts from "@modules/products/components/related-products"
import ProductInfo, {
  ProductDescription,
} from "@modules/products/templates/product-info"
import SkeletonRelatedProducts from "@modules/skeletons/templates/skeleton-related-products"
import { notFound } from "next/navigation"
import { HttpTypes } from "@medusajs/types"

import ProductActionsWrapper from "./product-actions-wrapper"

type ProductTemplateProps = {
  product: HttpTypes.StoreProduct
  region: HttpTypes.StoreRegion
  countryCode: string
  images: HttpTypes.StoreProductImage[]
  videos?: ProductVideo[]
}

const ProductTemplate: React.FC<ProductTemplateProps> = ({
  product,
  region,
  countryCode,
  images,
  videos = [],
}) => {
  if (!product || !product.id) {
    return notFound()
  }

  return (
    <>
      {/* Full-width image grid on the left, the buy panel pinned on the right.
          The panel scrolls on its own when it is taller than the screen, so
          the add button is always within reach while browsing the images. */}
      <div
        className="mx-auto grid w-full max-w-[1920px] grid-cols-1 small:grid-cols-[minmax(0,1fr)_400px] medium:grid-cols-[minmax(0,1fr)_460px] items-start"
        data-testid="product-container"
      >
        <div className="min-w-0">
          <ImageGallery images={images} videos={videos} title={product.title} />
        </div>

        <div className="flex flex-col gap-y-6 px-6 py-6 small:sticky small:top-16 small:max-h-[calc(100vh-4rem)] small:overflow-y-auto small:border-l small:border-paper-200 small:px-10 small:py-8 no-scrollbar">
          <ProductOnboardingCta />
          <ProductInfo product={product} />
          <Suspense
            fallback={
              <ProductActions
                disabled={true}
                product={product}
                region={region}
              />
            }
          >
            <ProductActionsWrapper id={product.id} region={region} />
          </Suspense>
          <ProductDescription product={product} />
          <ProductTabs product={product} />
        </div>
      </div>
      <Suspense fallback={null}>
        <ProductStoryTeaser productHandle={product.handle} />
      </Suspense>
      <div
        className="content-container my-16 small:my-32"
        data-testid="related-products-container"
      >
        <Suspense fallback={<SkeletonRelatedProducts />}>
          <RelatedProducts product={product} countryCode={countryCode} />
        </Suspense>
      </div>
    </>
  )
}

export default ProductTemplate
