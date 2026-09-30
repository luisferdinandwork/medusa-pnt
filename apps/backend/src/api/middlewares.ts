import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import {
  CreateArticleSchema,
  UpdateArticleSchema,
} from "./admin/articles/validators"
import {
  CopyBannersSchema,
  CreateBannerSchema,
  ReorderBannersSchema,
  UpdateBannerSchema,
} from "./admin/banners/validators"
import {
  CreatePaymentGatewaySchema,
  UpdatePaymentGatewaySchema,
} from "./admin/payment-gateways/validators"
import { UpdateProductPricingSchema } from "./admin/product-pricing/validators"
import {
  CreateProductStorySchema,
  UpdateProductStorySchema,
} from "./admin/product-stories/validators"
import {
  CreateStorefrontSchema,
  UpdateStorefrontSchema,
} from "./admin/storefronts/validators"
import { assignPaymentGateway } from "./utils/payment-gateways"

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/storefronts",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateStorefrontSchema)],
    },
    {
      matcher: "/admin/storefronts/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateStorefrontSchema)],
    },
    {
      matcher: "/admin/articles",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateArticleSchema)],
    },
    {
      matcher: "/admin/articles/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateArticleSchema)],
    },
    {
      matcher: "/admin/product-stories",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateProductStorySchema)],
    },
    {
      matcher: "/admin/product-stories/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateProductStorySchema)],
    },
    {
      matcher: "/admin/banners",
      method: "POST",
      middlewares: [validateAndTransformBody(CreateBannerSchema)],
    },
    {
      matcher: "/admin/banners/reorder",
      method: "POST",
      middlewares: [validateAndTransformBody(ReorderBannersSchema)],
    },
    {
      matcher: "/admin/banners/copy",
      method: "POST",
      middlewares: [validateAndTransformBody(CopyBannersSchema)],
    },
    {
      matcher: "/admin/banners/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateBannerSchema)],
    },
    {
      matcher: "/admin/product-pricing/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdateProductPricingSchema)],
    },
    {
      matcher: "/admin/payment-gateways",
      method: "POST",
      middlewares: [validateAndTransformBody(CreatePaymentGatewaySchema)],
    },
    {
      matcher: "/admin/payment-gateways/:id",
      method: "POST",
      middlewares: [validateAndTransformBody(UpdatePaymentGatewaySchema)],
    },
    // Midtrans / DOKU sessions: only gateways the cart's sales channel offers.
    {
      matcher: "/store/payment-collections/:id/payment-sessions",
      method: "POST",
      middlewares: [assignPaymentGateway],
    },
  ],
})
