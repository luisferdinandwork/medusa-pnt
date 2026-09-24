"use client"

import { useActionState, useState, useTransition } from "react"
import { setAddresses } from "@/lib/actions/cart"
import type { FormState } from "@/lib/actions/auth"

type Address = {
  id?: string
  first_name?: string | null
  last_name?: string | null
  company?: string | null
  phone?: string | null
  address_1?: string | null
  province?: string | null
  city?: string | null
  postal_code?: string | null
}

const COMPARED = ["first_name", "last_name", "company", "phone", "address_1", "province", "city", "postal_code"] as const

function isSameAddress(a: Address, b: Address) {
  return COMPARED.every((field) => (a[field] ?? "") === (b[field] ?? ""))
}

function Input({ name, label, defaultValue, type = "text", className = "" }: { name: string; label: string; defaultValue?: string | null; type?: string; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} className="input" />
    </div>
  )
}

function AddressFields({ prefix, defaults }: { prefix: string; defaults: Address }) {
  const n = (field: string) => `${prefix}.${field}`
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Input name={n("first_name")} label="Nama depan" defaultValue={defaults.first_name} />
      <Input name={n("last_name")} label="Nama belakang" defaultValue={defaults.last_name} />
      <Input name={n("company")} label="Perusahaan / toko" defaultValue={defaults.company} className="sm:col-span-2" />
      <Input name={n("phone")} label="No. telepon" type="tel" defaultValue={defaults.phone} className="sm:col-span-2" />
      <Input name={n("address_1")} label="Alamat lengkap" defaultValue={defaults.address_1} className="sm:col-span-2" />
      <Input name={n("city")} label="Kota / kabupaten" defaultValue={defaults.city} />
      <Input name={n("province")} label="Provinsi" defaultValue={defaults.province} />
      <Input name={n("postal_code")} label="Kode pos" defaultValue={defaults.postal_code} />
    </div>
  )
}

export function AddressForm({
  email,
  savedAddresses,
  shipping,
  billing,
  profile,
}: {
  email: string
  savedAddresses: Address[]
  shipping: Address | null
  billing: Address | null
  profile: Address
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(setAddresses, null)
  const [, startTransition] = useTransition()
  const [savedId, setSavedId] = useState("")
  const [sameAsBilling, setSameAsBilling] = useState(
    shipping && billing ? isSameAddress(shipping, billing) : true
  )

  const selected = savedAddresses.find((a) => a.id === savedId)
  // A fresh cart can carry an empty address object; only reuse a filled one.
  const shippingDefaults = selected ?? (shipping?.address_1 ? shipping : profile)

  // Submitted manually (not via <form action>) so React does not reset the
  // fields when the server rejects the input.
  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    startTransition(() => action(formData))
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <Input name="email" label="Email" type="email" defaultValue={email} />

      {savedAddresses.length > 0 && (
        <div>
          <label htmlFor="saved_address" className="label">Alamat tersimpan</label>
          <select
            id="saved_address"
            value={savedId}
            onChange={(e) => setSavedId(e.target.value)}
            className="input"
          >
            <option value="">Alamat baru</option>
            {savedAddresses.map((a) => (
              <option key={a.id} value={a.id}>
                {[a.first_name, a.last_name].filter(Boolean).join(" ")} - {a.address_1}, {a.city}
              </option>
            ))}
          </select>
        </div>
      )}

      <AddressFields key={savedId} prefix="shipping_address" defaults={shippingDefaults} />

      {!selected && (
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="save_address" />
          Simpan alamat ini untuk pesanan berikutnya
        </label>
      )}

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="same_as_billing"
          checked={sameAsBilling}
          onChange={(e) => setSameAsBilling(e.target.checked)}
        />
        Alamat penagihan sama dengan alamat pengiriman
      </label>

      {!sameAsBilling && (
        <div>
          <h3 className="mb-4 font-bold">Alamat penagihan</h3>
          <AddressFields prefix="billing_address" defaults={billing ?? {}} />
        </div>
      )}

      {state?.error && (
        <p role="alert" className="text-sm text-brand-700">{state.error}</p>
      )}
      <button type="submit" className="btn w-full sm:w-auto" disabled={pending}>
        {pending ? "Menyimpan..." : "Lanjut ke pengiriman"}
      </button>
    </form>
  )
}
