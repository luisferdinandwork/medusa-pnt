import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { listCategories, listProducts, lowestPrice } from "@/lib/data/catalog"
import { formatRupiah } from "@/lib/format"

export const metadata: Metadata = { title: "Katalog" }

type SearchParams = { q?: string; kategori?: string; halaman?: string }

function href(params: SearchParams) {
  const qs = new URLSearchParams()
  if (params.q) qs.set("q", params.q)
  if (params.kategori) qs.set("kategori", params.kategori)
  if (params.halaman && params.halaman !== "1") qs.set("halaman", params.halaman)
  const s = qs.toString()
  return s ? `/?${s}` : "/"
}

export default async function KatalogPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const page = Number(params.halaman) || 1

  const [categories, { products, count, pages }] = await Promise.all([
    listCategories(),
    listProducts({ q: params.q, categoryId: params.kategori, page }),
  ])

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl uppercase">Katalog Grosir</h1>
          <p className="mt-1 text-sm text-ink-500">{count} produk tersedia</p>
        </div>
        <form className="flex gap-2" action="/">
          {params.kategori && <input type="hidden" name="kategori" value={params.kategori} />}
          <input name="q" defaultValue={params.q} placeholder="Cari produk atau SKU" className="input sm:w-64" />
          <button type="submit" className="btn-outline">Cari</button>
        </form>
      </div>

      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide">
          <Link
            href={href({ q: params.q })}
            className={`rounded-full border px-3 py-1 ${!params.kategori ? "border-ink bg-ink text-paper" : "border-paper-200 hover:border-ink"}`}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={href({ q: params.q, kategori: c.id })}
              className={`rounded-full border px-3 py-1 ${params.kategori === c.id ? "border-ink bg-ink text-paper" : "border-paper-200 hover:border-ink"}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {products.length === 0 ? (
        <p className="py-16 text-center text-ink-500">Produk tidak ditemukan.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const price = lowestPrice(product)
            return (
              <li key={product.id}>
                <Link href={`/produk/${product.handle}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded bg-white">
                    {product.thumbnail && (
                      <Image
                        src={product.thumbnail}
                        alt={product.title}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-contain p-2 transition-transform group-hover:scale-105"
                      />
                    )}
                  </div>
                  <h2 className="mt-2 line-clamp-2 text-sm font-semibold group-hover:text-brand">{product.title}</h2>
                  {price && (
                    <p className="text-sm text-ink-500">
                      Mulai <span className="font-semibold text-ink">{formatRupiah(price.amount, price.currency)}</span>
                    </p>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 && (
            <Link className="btn-outline" href={href({ ...params, halaman: String(page - 1) })}>Sebelumnya</Link>
          )}
          <span className="text-ink-500">Halaman {page} dari {pages}</span>
          {page < pages && (
            <Link className="btn-outline" href={href({ ...params, halaman: String(page + 1) })}>Berikutnya</Link>
          )}
        </div>
      )}
    </>
  )
}
