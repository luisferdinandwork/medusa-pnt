import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { AddToCart } from "@/components/add-to-cart"
import { getProduct } from "@/lib/data/catalog"

type Props = { params: Promise<{ handle: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const product = await getProduct(handle)
  return { title: product?.title ?? "Produk" }
}

export default async function ProdukPage({ params }: Props) {
  const { handle } = await params
  const product = await getProduct(handle)
  if (!product) notFound()

  const images = product.images?.length
    ? product.images.map((i) => i.url)
    : product.thumbnail
      ? [product.thumbnail]
      : []

  return (
    <>
      <Link href="/" className="text-sm text-ink-500 hover:text-brand">&larr; Kembali ke katalog</Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-3">
          {images.map((url, i) => (
            <div key={url} className={`relative aspect-square overflow-hidden rounded bg-white ${i === 0 ? "col-span-2" : ""}`}>
              <Image src={url} alt={product.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain p-4" priority={i === 0} />
            </div>
          ))}
        </div>

        <div>
          <h1 className="font-display text-3xl uppercase">{product.title}</h1>
          {product.description && <p className="mt-3 text-sm leading-relaxed text-ink-500">{product.description}</p>}
          <div className="mt-6">
            <AddToCart product={product} />
          </div>
        </div>
      </div>
    </>
  )
}
