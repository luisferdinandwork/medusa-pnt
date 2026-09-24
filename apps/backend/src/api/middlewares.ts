import {
  defineMiddlewares,
  validateAndTransformBody,
} from "@medusajs/framework/http"
import {
  CreateStorefrontSchema,
  UpdateStorefrontSchema,
} from "./admin/storefronts/validators"

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
  ],
})
