import Link from "next/link"
import { logout } from "@/lib/actions/auth"
import { getCart } from "@/lib/data/cart"
import { getStoreConfig } from "@/lib/store-config"
import { Brand } from "./brand"
import { MiniCart } from "./mini-cart"

export async function Nav({ name }: { name: string }) {
  const [cart, config] = await Promise.all([getCart(), getStoreConfig()])

  return (
    <header className="sticky top-0 z-40 border-b border-paper-200 bg-paper">
      <nav className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="font-display text-2xl uppercase tracking-tight hover:text-brand">
          <Brand name={config.shortName} />
        </Link>

        <ul className="flex items-center gap-4 text-xs font-semibold uppercase tracking-wide text-ink-500 sm:gap-6">
          <li><Link href="/" className="hover:text-brand">Katalog</Link></li>
          <li><Link href="/pesanan" className="hover:text-brand">Pesanan</Link></li>
          <li><Link href="/akun" className="hover:text-brand">{name}</Link></li>
          <li><MiniCart cart={cart} /></li>
          <li>
            <form action={logout}>
              <button type="submit" className="uppercase hover:text-brand">Keluar</button>
            </form>
          </li>
        </ul>
      </nav>
    </header>
  )
}
