import { listCartOptions, retrieveCart } from "@lib/data/cart"
import { retrieveCustomer } from "@lib/data/customer"
import { getStoreConfig } from "@lib/data/store-config"
import { StoreCartShippingOption } from "@medusajs/types"
import CartTemplate from "@modules/cart/templates"
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

  return (
    <CartTemplate cart={cart} customer={customer} shippingOptions={shippingOptions} />
  )
}
