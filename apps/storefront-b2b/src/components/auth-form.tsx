"use client"

import Link from "next/link"
import { useActionState } from "react"
import { login, register, type FormState } from "@/lib/actions/auth"
import { SubmitButton } from "./submit-button"

function Field({ name, label, type = "text", required = true, autoComplete }: { name: string; label: string; type?: string; required?: boolean; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} required={required} autoComplete={autoComplete} className="input" />
    </div>
  )
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<FormState, FormData>(login, null)
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? "/"} />
      <Field name="email" label="Email" type="email" autoComplete="email" />
      <Field name="password" label="Kata sandi" type="password" autoComplete="current-password" />
      {state?.error && <p role="alert" className="text-sm text-brand-700">{state.error}</p>}
      <SubmitButton pendingText="Masuk...">Masuk</SubmitButton>
      <p className="text-center text-sm text-ink-500">
        Belum punya akun?{" "}
        <Link href="/daftar" className="font-semibold text-ink underline">Daftar sebagai mitra</Link>
      </p>
    </form>
  )
}

export function RegisterForm() {
  const [state, action] = useActionState<FormState, FormData>(register, null)
  return (
    <form action={action} className="space-y-4">
      <Field name="company_name" label="Nama perusahaan / toko" autoComplete="organization" />
      <div className="grid grid-cols-2 gap-3">
        <Field name="first_name" label="Nama depan" autoComplete="given-name" />
        <Field name="last_name" label="Nama belakang" autoComplete="family-name" />
      </div>
      <Field name="phone" label="No. telepon / WhatsApp" type="tel" autoComplete="tel" />
      <Field name="email" label="Email" type="email" autoComplete="email" />
      <Field name="password" label="Kata sandi (min. 8 karakter)" type="password" autoComplete="new-password" />
      {state?.error && <p role="alert" className="text-sm text-brand-700">{state.error}</p>}
      <SubmitButton pendingText="Mendaftar...">Daftar</SubmitButton>
      <p className="text-center text-sm text-ink-500">
        Sudah punya akun?{" "}
        <Link href="/masuk" className="font-semibold text-ink underline">Masuk</Link>
      </p>
    </form>
  )
}
