import { getCheckoutStep } from "@lib/util/get-checkout-step"
import { HttpTypes } from "@medusajs/types"
import { clx } from "@modules/common/components/ui"

const STEPS: { key: ReturnType<typeof getCheckoutStep>; label: string }[] = [
  { key: "address", label: "Data" },
  { key: "delivery", label: "Pengiriman" },
  { key: "payment", label: "Pembayaran" },
]

export default function CheckoutSteps({ cart }: { cart: HttpTypes.StoreCart }) {
  const currentStep = getCheckoutStep(cart)
  const currentIndex = STEPS.findIndex((s) => s.key === currentStep)

  return (
    <div className="flex items-center gap-x-4 small:gap-x-8 pb-8">
      {STEPS.map((step, index) => (
        <div key={step.key} className="flex items-center gap-x-4 small:gap-x-8">
          <div className="flex items-center gap-x-2">
            <span
              className={clx(
                "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
                index <= currentIndex
                  ? "bg-red-500 text-white"
                  : "bg-paper-200 text-ink-500"
              )}
            >
              {index + 1}
            </span>
            <span
              className={clx(
                "text-xs font-semibold uppercase tracking-wide",
                index <= currentIndex ? "text-ink" : "text-ink-500/50"
              )}
            >
              {step.label}
            </span>
          </div>
          {index < STEPS.length - 1 && (
            <span className="h-px w-8 small:w-16 bg-paper-200" />
          )}
        </div>
      ))}
    </div>
  )
}
