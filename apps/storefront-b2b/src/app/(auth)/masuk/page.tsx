import type { Metadata } from "next"
import { LoginForm } from "@/components/auth-form"

export const metadata: Metadata = { title: "Masuk" }

export default async function MasukPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams
  return (
    <>
      <h1 className="text-xl font-bold">Masuk ke portal grosir</h1>
      <p className="mb-6 mt-1 text-sm text-ink-500">
        Toko ini khusus mitra. Masuk untuk melihat katalog dan harga.
      </p>
      <LoginForm next={next} />
    </>
  )
}
