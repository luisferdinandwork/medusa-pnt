"use client"

import { transferCart } from "@lib/data/customer"
import { ExclamationCircleSolid } from "@medusajs/icons"
import { StoreCart, StoreCustomer } from "@medusajs/types"
import { Button } from "@modules/common/components/ui"
import { useEffect, useRef, useState } from "react"

/**
 * Shown when a signed-in customer holds a cart that isn't linked to their
 * account - the transfer at sign-in failed, for example because the backend
 * was briefly unavailable. It retries once on its own before asking the
 * shopper, since a second attempt almost always succeeds.
 */
function CartMismatchBanner(props: {
  customer: StoreCustomer
  cart: StoreCart
}) {
  const { customer, cart } = props
  const needsTransfer = !!customer && !cart.customer_id
  const [status, setStatus] = useState<"retrying" | "failed" | "pending">(
    "retrying"
  )
  const retried = useRef(false)

  const runTransfer = async () => {
    try {
      // On success the server action revalidates the cart and the banner
      // disappears with the refreshed page.
      await transferCart()
    } catch {
      setStatus("failed")
    }
  }

  useEffect(() => {
    if (!needsTransfer || retried.current) {
      return
    }
    retried.current = true
    runTransfer()
  }, [needsTransfer])

  if (!needsTransfer || status === "retrying") {
    return null
  }

  return (
    <div className="flex items-center justify-center small:p-4 p-2 text-center bg-orange-300 small:gap-2 gap-1 text-sm mt-2 text-orange-800">
      <div className="flex flex-col small:flex-row small:gap-2 gap-1 items-center">
        <span className="flex items-center gap-1">
          <ExclamationCircleSolid className="inline" />
          Tas belanja kamu belum tersambung ke akun, jadi isinya belum tersimpan
          di akunmu.
        </span>

        <span>·</span>

        <Button
          variant="transparent"
          className="hover:bg-transparent active:bg-transparent focus:bg-transparent disabled:text-orange-500 text-orange-950 p-0 bg-transparent"
          size="medium"
          disabled={status === "pending"}
          onClick={() => {
            setStatus("pending")
            runTransfer()
          }}
        >
          {status === "pending" ? "Menyambungkan..." : "Sambungkan sekarang"}
        </Button>
      </div>
    </div>
  )
}

export default CartMismatchBanner
