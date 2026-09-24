"use client"

import { useActionState } from "react"
import type { FormState } from "@/lib/actions/auth"
import { SubmitButton } from "./submit-button"

// A checkout step form: runs a server action, shows its error, and moves on.
// Server-rendered inputs are passed as children.
export function StepForm({
  action,
  submitLabel,
  pendingLabel,
  disabled,
  children,
}: {
  action: (state: FormState, formData: FormData) => Promise<FormState>
  submitLabel: string
  pendingLabel: string
  disabled?: boolean
  children?: React.ReactNode
}) {
  const [state, formAction] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {children}
      {state?.error && (
        <p role="alert" className="text-sm text-brand-700">
          {state.error}
        </p>
      )}
      {disabled ? (
        <button type="button" className="btn w-full sm:w-auto" disabled>
          {submitLabel}
        </button>
      ) : (
        <SubmitButton pendingText={pendingLabel}>{submitLabel}</SubmitButton>
      )}
    </form>
  )
}
