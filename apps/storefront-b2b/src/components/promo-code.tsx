"use client"

import { useActionState } from "react"
import { applyPromoCode, removePromoCode } from "@/lib/actions/cart"
import type { FormState } from "@/lib/actions/auth"

export function PromoCode({ codes }: { codes: string[] }) {
  const [state, action, pending] = useActionState<FormState, FormData>(applyPromoCode, null)

  return (
    <div className="text-sm">
      <details open={codes.length > 0 || !!state?.error}>
        <summary className="cursor-pointer font-semibold text-brand hover:text-brand-600">
          Kode promo
        </summary>

        <form action={action} className="mt-2 flex gap-2">
          <input
            name="code"
            placeholder="Masukkan kode"
            aria-label="Kode promo"
            className="input"
            data-testid="promo-input"
          />
          <button type="submit" className="btn-outline" disabled={pending}>
            {pending ? "..." : "Terapkan"}
          </button>
        </form>
        {state?.error && (
          <p role="alert" className="mt-2 text-brand-700">
            {state.error}
          </p>
        )}
      </details>

      {codes.length > 0 && (
        <ul className="mt-3 space-y-1">
          {codes.map((code) => (
            <li key={code} className="flex items-center justify-between rounded bg-brand-50 px-3 py-2">
              <span className="font-semibold" data-testid="promo-applied">{code}</span>
              <form action={removePromoCode}>
                <input type="hidden" name="code" value={code} />
                <button type="submit" className="text-xs underline hover:text-brand">
                  Hapus
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
