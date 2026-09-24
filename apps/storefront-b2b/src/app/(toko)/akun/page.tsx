import type { Metadata } from "next"
import { logout } from "@/lib/actions/auth"
import { requireCustomer } from "@/lib/data/customer"

export const metadata: Metadata = { title: "Akun" }

export default async function AkunPage() {
  const customer = await requireCustomer()
  const rows: [string, string | null | undefined][] = [
    ["Perusahaan / toko", customer.company_name],
    ["Nama", [customer.first_name, customer.last_name].filter(Boolean).join(" ")],
    ["Email", customer.email],
    ["Telepon", customer.phone],
  ]

  return (
    <>
      <h1 className="mb-6 font-display text-3xl uppercase">Akun</h1>
      <dl className="max-w-lg divide-y divide-paper-200 rounded-lg border border-paper-200 bg-white text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-4 px-4 py-3">
            <dt className="text-ink-500">{label}</dt>
            <dd className="font-semibold">{value || "-"}</dd>
          </div>
        ))}
      </dl>
      <form action={logout} className="mt-6">
        <button type="submit" className="btn-outline">Keluar</button>
      </form>
    </>
  )
}
