"use client"

import { Button } from "@modules/common/components/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Divider from "@modules/common/components/divider"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes, StoreCartShippingOption } from "@medusajs/types"
import { getCheckoutStep } from "@lib/util/get-checkout-step"
import FreeShippingPriceNudge from "@modules/shipping/components/free-shipping-price-nudge"

type SummaryProps = {
  cart: HttpTypes.StoreCart
  shippingOptions?: StoreCartShippingOption[]
}

const Summary = ({ cart, shippingOptions }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-4">
      <h2 className="font-display uppercase text-3xl">Ringkasan</h2>
      {!!shippingOptions?.length && (
        <FreeShippingPriceNudge
          variant="inline"
          cart={cart}
          shippingOptions={shippingOptions}
        />
      )}
      <DiscountCode cart={cart} />
      <Divider />
      <CartTotals totals={cart} />
      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
      >
        <Button className="w-full h-12">Lanjut ke Pembayaran</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default Summary
