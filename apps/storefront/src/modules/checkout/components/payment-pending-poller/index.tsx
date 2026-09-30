"use client"

import { settleGatewayPayment } from "@lib/data/payment-gateway"
import { Button, Text } from "@modules/common/components/ui"
import { useCallback, useEffect, useRef, useState } from "react"

const INTERVAL_MS = 10_000
// After this the page stops asking on its own; the button still works and
// the gateway's notification still places the order.
const GIVE_UP_MS = 15 * 60_000

const go = (redirectTo: string) =>
  window.location.assign(
    redirectTo.startsWith("/") ? `${window.location.origin}${redirectTo}` : redirectTo
  )

/**
 * Asks the backend every few seconds whether the gateway has the money yet,
 * and moves on to the order (or back to the payment step) once it knows.
 */
const PaymentPendingPoller = ({
  cartId,
  countryCode,
}: {
  cartId: string
  countryCode: string
}) => {
  const [checking, setChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [stopped, setStopped] = useState(false)
  const busy = useRef(false)
  const startedAt = useRef(Date.now())

  const check = useCallback(async () => {
    if (busy.current) {
      return
    }
    busy.current = true
    setChecking(true)
    try {
      const outcome = await settleGatewayPayment(cartId, countryCode)
      if (outcome.status !== "pending") {
        go(outcome.redirectTo)
        return
      }
      setLastChecked(new Date())
    } catch {
      setLastChecked(new Date())
    } finally {
      busy.current = false
      setChecking(false)
    }
  }, [cartId, countryCode])

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt.current > GIVE_UP_MS) {
        setStopped(true)
        window.clearInterval(timer)
        return
      }
      if (document.visibilityState === "visible") {
        check()
      }
    }, INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [check])

  return (
    <div className="flex flex-col gap-y-2">
      <Button
        variant="secondary"
        size="large"
        onClick={check}
        isLoading={checking}
        data-testid="check-payment-button"
      >
        Saya sudah bayar, cek status
      </Button>
      <Text className="text-small-regular text-ui-fg-subtle" aria-live="polite">
        {stopped
          ? "Status tidak lagi dicek otomatis. Tekan tombol di atas setelah membayar."
          : lastChecked
          ? `Dicek otomatis setiap 10 detik. Terakhir ${lastChecked.toLocaleTimeString("id-ID")}.`
          : "Halaman ini mengecek status pembayaran otomatis."}
      </Text>
    </div>
  )
}

export default PaymentPendingPoller
