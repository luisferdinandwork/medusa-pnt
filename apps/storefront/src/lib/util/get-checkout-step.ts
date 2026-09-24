import { HttpTypes } from "@medusajs/types"

export function getCheckoutStep(
  cart: HttpTypes.StoreCart
): "address" | "delivery" | "payment" {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}
