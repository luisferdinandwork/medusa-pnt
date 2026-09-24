import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { getStoreConfig } from "@lib/data/store-config"
import { StoreRegion } from "@medusajs/types"
import { MagnifyingGlass, User } from "@medusajs/icons"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import SideMenu from "@modules/layout/components/side-menu"

export default async function Nav() {
  const [regions, locales, currentLocale, productCategories, storeConfig] =
    await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
      listCategories(),
      getStoreConfig(),
    ])

  const topLevelCategories = (productCategories || []).filter(
    (c) => !c.parent_category
  )

  return (
    <div className="sticky top-0 inset-x-0 z-50 group">
      <header className="relative h-16 mx-auto duration-200 bg-paper border-b border-paper-200">
        <nav className="content-container flex items-center justify-between w-full h-full text-small-regular">
          <div className="flex-1 basis-0 h-full flex items-center gap-x-6">
            <SideMenu
              storeName={storeConfig.name}
              regions={regions}
              locales={locales}
              currentLocale={currentLocale}
            />
            <ul className="hidden small:flex items-center gap-x-6 h-full text-ink-500 text-xs font-semibold uppercase tracking-wide">
              {topLevelCategories.slice(0, 4).map((category) => (
                <li key={category.id}>
                  <LocalizedClientLink
                    href={`/categories/${category.handle}`}
                    className="hover:text-red-500 transition-colors"
                  >
                    {category.name}
                  </LocalizedClientLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center h-full">
            <LocalizedClientLink
              href="/"
              className="flex items-center gap-x-2 group"
              data-testid="nav-store-link"
            >
              <Image
                src="/logo/3.png"
                alt=""
                aria-hidden
                width={28}
                height={28}
                className="h-7 w-7 object-contain"
                priority
              />
              <span className="font-display uppercase text-2xl tracking-tight group-hover:text-red-500 transition-colors">
                {storeConfig.shortName}
              </span>
            </LocalizedClientLink>
          </div>

          <div className="flex items-center gap-x-5 h-full flex-1 basis-0 justify-end">
            <button
              type="button"
              aria-label="Cari"
              className="hidden small:flex hover:text-red-500 transition-colors"
            >
              <MagnifyingGlass />
            </button>
            <LocalizedClientLink
              className="hidden small:flex hover:text-red-500 transition-colors"
              href="/account"
              data-testid="nav-account-link"
              aria-label="Akun"
            >
              <User />
            </LocalizedClientLink>
            <Suspense
              fallback={
                <LocalizedClientLink
                  className="hover:text-red-500 flex gap-2"
                  href="/cart"
                  data-testid="nav-cart-link"
                >
                  Tas (0)
                </LocalizedClientLink>
              }
            >
              <CartButton />
            </Suspense>
          </div>
        </nav>
      </header>
    </div>
  )
}
