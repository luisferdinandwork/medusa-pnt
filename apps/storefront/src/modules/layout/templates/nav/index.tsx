import { Suspense } from "react"

import { listCategories } from "@lib/data/categories"
import { listLocales } from "@lib/data/locales"
import { getLocale } from "@lib/data/locale-actions"
import { listRegions } from "@lib/data/regions"
import { getStoreConfig } from "@lib/data/store-config"
import { buildCategoryMenu } from "@lib/util/category-tree"
import { StoreRegion } from "@medusajs/types"
import { MagnifyingGlass, User } from "@medusajs/icons"
import Image from "next/image"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import CartButton from "@modules/layout/components/cart-button"
import MegaMenu from "@modules/layout/components/mega-menu"
import NavShell from "@modules/layout/components/nav-shell"
import SideMenu from "@modules/layout/components/side-menu"

// The header shows the four main categories (Footwear, Apparel, Accessories,
// Equipment - the top-level categories in admin order); their subcategories
// open in the mega menu.
const MAIN_CATEGORY_COUNT = 4

export default async function Nav() {
  const [regions, locales, currentLocale, productCategories, storeConfig] =
    await Promise.all([
      listRegions().then((regions: StoreRegion[]) => regions),
      listLocales(),
      getLocale(),
      listCategories(),
      getStoreConfig(),
    ])

  const menu = buildCategoryMenu(productCategories || []).slice(0, MAIN_CATEGORY_COUNT)

  return (
    <NavShell>
      <nav className="content-container flex h-full w-full items-center justify-between text-small-regular">
        <div className="flex h-full flex-1 basis-0 items-center gap-x-4">
          <SideMenu
            storeName={storeConfig.name}
            regions={regions}
            locales={locales}
            currentLocale={currentLocale}
            categories={menu}
          />
          <MegaMenu categories={menu} />
        </div>

        <div className="flex h-full items-center">
          <LocalizedClientLink
            href="/"
            className="group flex items-center gap-x-2"
            data-testid="nav-store-link"
          >
            <Image
              src="/logo/3.png"
              alt=""
              aria-hidden
              width={28}
              height={28}
              className="h-7 w-7 object-contain group-data-[transparent=true]/nav:hidden"
              priority
            />
            <Image
              src="/logo/4.png"
              alt=""
              aria-hidden
              width={28}
              height={28}
              className="hidden h-7 w-7 object-contain group-data-[transparent=true]/nav:block"
              priority
            />
            <span className="font-display text-2xl uppercase tracking-tight transition-colors group-hover:text-red-500">
              {storeConfig.shortName}
            </span>
          </LocalizedClientLink>
        </div>

        <div className="flex h-full flex-1 basis-0 items-center justify-end gap-x-5">
          <button
            type="button"
            aria-label="Cari"
            className="hidden transition-colors hover:text-red-500 small:flex"
          >
            <MagnifyingGlass />
          </button>
          <LocalizedClientLink
            className="hidden transition-colors hover:text-red-500 small:flex"
            href="/account"
            data-testid="nav-account-link"
            aria-label="Akun"
          >
            <User />
          </LocalizedClientLink>
          <Suspense
            fallback={
              <LocalizedClientLink
                className="flex gap-2 hover:text-red-500"
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
    </NavShell>
  )
}
