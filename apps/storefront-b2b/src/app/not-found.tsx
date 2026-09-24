import Link from "next/link"

export default function NotFound() {
  return (
    <div className="container-page py-24 text-center">
      <h1 className="font-display text-4xl uppercase">Halaman tidak ditemukan</h1>
      <p className="mt-3 text-ink-500">Halaman yang Anda cari tidak tersedia.</p>
      <Link href="/" className="btn mt-8">
        Kembali ke katalog
      </Link>
    </div>
  )
}
