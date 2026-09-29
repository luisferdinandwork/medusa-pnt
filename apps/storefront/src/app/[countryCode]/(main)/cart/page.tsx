import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { getOmnichannelAvailability } from "@lib/data/omnichannel"
import { retrieveCustomer } from "@lib/data/customer"
import { getStoreConfig } from "@lib/data/store-config"
import { StoreCartShippingOption } from "@medusajs/types"
import CartTemplate from "@modules/cart/templates"
import CartMismatchBanner from "@modules/layout/components/cart-mismatch-banner"
import { Metadata } from "next"
import { notFound } from "next/navigation"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: "Tas Belanja",
    description: `Lihat tas belanja kamu di ${storeConfig.name}.`,
  }
}

export default async function Cart() {
  const cart = await retrieveCart().catch((error) => {
    console.error(error)
    return notFound()
  })

  const customer = await retrieveCustomer()

  let shippingOptions: StoreCartShippingOption[] = []
  if (cart) {
    const { shipping_options } = await listCartOptions()
    shippingOptions = shipping_options
  }

  // Live stock per ship-from location: caps each line's quantity stepper and
  // lists the locations a line can move to.
  const omnichannel = await getOmnichannelAvailability(
    (cart?.items ?? []).map((item) => item.variant_id ?? "")
  )

  return (
    <>
      {/* Only here: the bag page is where an unlinked cart matters. */}
      {customer && cart && <CartMismatchBanner customer={customer} cart={cart} />}
      <CartTemplate
        cart={cart}
        customer={customer}
        shippingOptions={shippingOptions}
        omnichannel={omnichannel}
      />
    </>
  )
}
