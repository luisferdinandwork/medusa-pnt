"use client"

import { ArrowRightOnRectangle } from "@medusajs/icons"
import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"

import { signout } from "@lib/data/customer"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Grid from "@modules/common/icons/grid"
import MapPin from "@modules/common/icons/map-pin"
import Package from "@modules/common/icons/package"
import User from "@modules/common/icons/user"

const NAV_ITEMS = [
  { href: "/account", label: "Ringkasan", icon: Grid, testId: "overview-link" },
  { href: "/account/profile", label: "Profil", icon: User, testId: "profile-link" },
  { href: "/account/addresses", label: "Alamat", icon: MapPin, testId: "addresses-link" },
  { href: "/account/orders", label: "Pesanan", icon: Package, testId: "orders-link" },
]

const AccountNav = ({
  customer,
}: {
  customer: HttpTypes.StoreCustomer | null
}) => {
  const route = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const handleLogout = async () => {
    await signout(countryCode)
  }

  return (
    <div>
      <div className="small:hidden -mx-6 px-6" data-testid="mobile-account-nav">
        <ul className="flex items-center gap-x-2 overflow-x-auto no-scrollbar pb-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, testId }) => (
            <li key={href} className="shrink-0">
              <AccountNavLink href={href} route={route!} icon={Icon} data-testid={testId} pill>
                {label}
              </AccountNavLink>
            </li>
          ))}
          <li className="shrink-0">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-x-2 rounded-full border border-paper-200 px-4 py-2 text-small-regular text-ink-500 hover:border-red-500 hover:text-red-500 transition-colors"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle size={16} />
              <span>Keluar</span>
            </button>
          </li>
        </ul>
      </div>
      <div className="hidden small:block" data-testid="account-nav">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-4">
          Akun
        </h3>
        <ul className="flex flex-col gap-y-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, testId }) => (
            <li key={href}>
              <AccountNavLink href={href} route={route!} icon={Icon} data-testid={testId}>
                {label}
              </AccountNavLink>
            </li>
          ))}
          <li className="pt-3 mt-2 border-t border-paper-200">
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-x-3 w-full rounded-base px-3 py-2.5 -mx-3 text-ink-500 hover:text-red-500 transition-colors"
              data-testid="logout-button"
            >
              <ArrowRightOnRectangle />
              <span>Keluar</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

type AccountNavLinkProps = {
  href: string
  route: string
  icon: React.ComponentType<{ size?: string | number; className?: string }>
  children: React.ReactNode
  pill?: boolean
  "data-testid"?: string
}

const AccountNavLink = ({
  href,
  route,
  icon: Icon,
  children,
  pill = false,
  "data-testid": dataTestId,
}: AccountNavLinkProps) => {
  const { countryCode }: { countryCode: string } = useParams()

  const active = route.split(countryCode)[1] === href

  if (pill) {
    return (
      <LocalizedClientLink
        href={href}
        className={clx(
          "flex items-center gap-x-2 rounded-full border px-4 py-2 text-small-regular transition-colors",
          active
            ? "border-ink bg-ink text-white"
            : "border-paper-200 text-ink-500 hover:border-ink hover:text-ink"
        )}
        data-testid={dataTestId}
      >
        <Icon size={16} />
        {children}
      </LocalizedClientLink>
    )
  }

  return (
    <LocalizedClientLink
      href={href}
      className={clx(
        "flex items-center gap-x-3 rounded-base px-3 py-2.5 -mx-3 text-ink-500 hover:text-ink transition-colors",
        {
          "text-ink font-semibold bg-paper-100": active,
        }
      )}
      data-testid={dataTestId}
    >
      <Icon size={20} className={active ? "text-red-500" : undefined} />
      {children}
    </LocalizedClientLink>
  )
}

export default AccountNav
