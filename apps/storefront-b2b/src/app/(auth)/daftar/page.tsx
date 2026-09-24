import type { Metadata } from "next"
import { RegisterForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Daftar" }

export default function DaftarPage() {
  return (
    <>
      <h1 className="text-xl font-bold">Daftar sebagai mitra</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Buat akun bisnis untuk memesan produk SPECS dalam jumlah besar.
      </p>
      <RegisterForm />
    </>
  )
}
