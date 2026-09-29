"use client"

import { clx } from "@modules/common/components/ui"
import { useParams, usePathname } from "next/navigation"
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"

/**
 * Put this attribute on a full-bleed element at the top of a page (the
 * homepage slider) and the header turns transparent with light text while it
 * sits over that element. The element pulls itself up under the header.
 */
export const NAV_OVERLAY_ATTRIBUTE = "data-nav-overlay"

type NavState = {
  transparent: boolean
  setMenuOpen: (open: boolean) => void
}

const NavContext = createContext<NavState>({
  transparent: false,
  setMenuOpen: () => {},
})

export const useNav = () => useContext(NavContext)

/**
 * The sticky header. Solid by default; transparent over a page's hero until
 * the shopper scrolls past it, points at the header, or opens a menu.
 * Children style themselves with `group-data-[transparent=true]/nav:`.
 */
export default function NavShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { countryCode } = useParams<{ countryCode: string }>()
  const isHome = pathname === `/${countryCode}` || pathname === `/${countryCode}/`
  const headerRef = useRef<HTMLElement>(null)

  // The server render guesses from the route (the homepage opens on the
  // slider); the effect below then checks the page itself.
  const [overHero, setOverHero] = useState(isHome)
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    let frame = 0
    const update = () => {
      const hero = document.querySelector(`[${NAV_OVERLAY_ATTRIBUTE}]`)
      const header = headerRef.current
      setOverHero(
        !!hero &&
          !!header &&
          hero.getBoundingClientRect().bottom > header.getBoundingClientRect().bottom
      )
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    // A client-side navigation can commit the new page a moment later.
    const late = setTimeout(update, 250)
    window.addEventListener("scroll", schedule, { passive: true })
    window.addEventListener("resize", schedule)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(late)
      window.removeEventListener("scroll", schedule)
      window.removeEventListener("resize", schedule)
    }
  }, [pathname])

  const transparent = overHero && !hovered && !menuOpen
  const value = useMemo(() => ({ transparent, setMenuOpen }), [transparent])

  return (
    <NavContext.Provider value={value}>
      <div
        className="group/nav sticky inset-x-0 top-0 z-50"
        data-transparent={transparent}
        onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
        onPointerLeave={(event) => event.pointerType === "mouse" && setHovered(false)}
      >
        {/* Behind the header (earlier in paint order), so it darkens the photo, not the links. */}
        <div
          aria-hidden
          className={clx(
            "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/50 to-transparent transition-opacity duration-300",
            transparent ? "opacity-100" : "opacity-0"
          )}
        />
        <header
          ref={headerRef}
          className={clx(
            "relative mx-auto h-16 border-b transition-colors duration-300",
            transparent
              ? "border-transparent bg-transparent text-white"
              : "border-paper-200 bg-paper text-ink"
          )}
        >
          {children}
        </header>
      </div>
    </NavContext.Provider>
  )
}
