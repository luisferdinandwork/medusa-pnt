import ItemsTemplate from "./items"
import Summary from "./summary"
import EmptyCartMessage from "../components/empty-cart-message"
import SignInPrompt from "../components/sign-in-prompt"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"

const CartTemplate = ({
  cart,
  customer,
  shippingOptions,
}: {
  cart: HttpTypes.StoreCart | null
  customer: HttpTypes.StoreCustomer | null
  shippingOptions?: StoreCartShippingOption[]
}) => {
  return (
    <div className="py-12">
      <div className="content-container" data-testid="cart-container">
        {cart?.items?.length ? (
          <div className="grid grid-cols-1 small:grid-cols-[1fr_380px] gap-8 small:gap-12 items-start">
            <div className="flex flex-col gap-y-6">
              {!customer && <SignInPrompt />}
              <ItemsTemplate cart={cart} />
            </div>
            <div className="relative">
              {cart && cart.region && (
                <div className="bg-white border border-paper-200 rounded-large p-6 sticky top-24">
                  <Summary cart={cart} shippingOptions={shippingOptions} />
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <EmptyCartMessage />
          </div>
        )}
      </div>
    </div>
  )
}

export default CartTemplate
