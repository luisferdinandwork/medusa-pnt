import { ShoppingBag } from "@medusajs/icons"
import { Button, Text } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

const EmptyCartMessage = () => {
  return (
    <div
      className="py-32 small:py-40 flex flex-col items-center text-center gap-y-4"
      data-testid="empty-cart-message"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-full bg-paper-100 text-ink-500">
        <ShoppingBag />
      </span>
      <h1 className="font-display uppercase text-3xl">Tas Belanja</h1>
      <Text className="text-base-regular max-w-sm text-ink-500">
        Tas belanja kamu masih kosong. Yuk mulai jelajahi produk kami.
      </Text>
      <LocalizedClientLink href="/store" className="mt-2">
        <Button size="large">Jelajahi Produk</Button>
      </LocalizedClientLink>
    </div>
  )
}

export default EmptyCartMessage
