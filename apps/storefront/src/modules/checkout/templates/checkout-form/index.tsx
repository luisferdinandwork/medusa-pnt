import { listCartShippingMethods } from "@lib/data/fulfillment"
import { listCartPaymentMethods, listPaymentGateways } from "@lib/data/payment"
import { getStoreConfig } from "@lib/data/store-config"
import { HttpTypes } from "@medusajs/types"
import Addresses from "@modules/checkout/components/addresses"
import CheckoutSteps from "@modules/checkout/components/checkout-steps"
import Payment from "@modules/checkout/components/payment"
import Review from "@modules/checkout/components/review"
import Shipping from "@modules/checkout/components/shipping"

export default async function CheckoutForm({
  cart,
  customer,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
}) {
  if (!cart) {
    return null
  }

  const shippingMethods = await listCartShippingMethods(cart.id)
  const paymentMethods = await listCartPaymentMethods(cart.region?.id ?? "")
  const paymentGateways = await listPaymentGateways()
  const storeConfig = await getStoreConfig()

  if (!shippingMethods || !paymentMethods) {
    return null
  }

  return (
    <div className="w-full grid grid-cols-1 gap-y-8">
      <CheckoutSteps cart={cart} />
      <Addresses cart={cart} customer={customer} />

      <Shipping cart={cart} availableShippingMethods={shippingMethods} />

      <Payment
        cart={cart}
        availablePaymentMethods={paymentMethods}
        paymentGateways={paymentGateways}
      />

      <Review cart={cart} storeName={storeConfig.name} />
    </div>
  )
}
