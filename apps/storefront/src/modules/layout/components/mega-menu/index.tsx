"use client"

import type { MenuCategory } from "@lib/util/category-tree"
import { clx } from "@modules/common/components/ui"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { useNav } from "@modules/layout/components/nav-shell"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"

const OPEN_DELAY_MS = 90
const CLOSE_DELAY_MS = 160

const TILE_COLS: Record<number, string> = {
  1: "grid-cols-1 max-w-xs",
  2: "grid-cols-2 max-w-2xl",
  3: "grid-cols-3",
  4: "grid-cols-4",
}

const Arrow = ({ className }: { className?: string }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden className={className}>
    <path d="M3 8h9.5M8.5 4 12.5 8l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const Panel = ({ category, onNavigate }: { category: MenuCategory; onNavigate: () => void }) => (
  <div className="content-container grid grid-cols-[minmax(0,240px)_1fr] gap-12 py-10">
    <div className="flex flex-col gap-y-6">
      <div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-red-500">
          Kategori
        </span>
        <p className="font-display mt-2 text-4xl uppercase leading-none">{category.name}</p>
        {category.description && (
          <p className="mt-3 text-sm leading-relaxed text-ink-500">{category.description}</p>
        )}
      </div>
      <ul className="flex flex-col">
        {category.children.map((child) => (
          <li key={child.id}>
            <LocalizedClientLink
              href={`/categories/${child.handle}`}
              onClick={onNavigate}
              className="group/link flex items-center justify-between border-b border-paper-200 py-2.5 text-sm font-medium text-ink-500 transition-colors hover:text-ink"
            >
              {child.name}
              <Arrow className="-translate-x-1 opacity-0 transition-all duration-200 group-hover/link:translate-x-0 group-hover/link:text-red-500 group-hover/link:opacity-100" />
            </LocalizedClientLink>
          </li>
        ))}
      </ul>
      <LocalizedClientLink
        href={`/categories/${category.handle}`}
        onClick={onNavigate}
        className="inline-flex h-10 w-fit items-center gap-x-2 rounded-full bg-ink px-5 text-xs font-semibold uppercase tracking-wide text-white transition-colors hover:bg-red-500"
      >
        Lihat semua
        <Arrow />
      </LocalizedClientLink>
    </div>

    <ul className={clx("grid gap-4", TILE_COLS[category.children.length] ?? "grid-cols-4")}>
      {category.children.map((child, index) => (
        <li key={child.id}>
          <LocalizedClientLink
            href={`/categories/${child.handle}`}
            onClick={onNavigate}
            className="group/tile flex flex-col gap-y-3"
            tabIndex={-1}
          >
            <span className="relative block aspect-[4/5] overflow-hidden rounded-large bg-photo">
              {child.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={child.image}
                  alt=""
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-contain p-6 mix-blend-darken transition-transform duration-500 ease-out group-hover/tile:scale-[1.06]"
                />
              )}
              <span aria-hidden className="absolute left-3 top-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-500/60">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="absolute bottom-3 right-3 flex h-9 w-9 translate-y-2 items-center justify-center rounded-full bg-ink text-white opacity-0 transition-all duration-300 group-hover/tile:translate-y-0 group-hover/tile:bg-red-500 group-hover/tile:opacity-100">
                <Arrow />
              </span>
            </span>
            <span className="text-sm font-semibold uppercase tracking-wide transition-colors group-hover/tile:text-red-500">
              {child.name}
            </span>
          </LocalizedClientLink>
        </li>
      ))}
    </ul>
  </div>
)

/**
 * The main categories in the header, each opening a full-width panel with
 * its subcategories as links and photo tiles. Opens on hover or keyboard
 * focus, closes on leave, Escape, a click or a page change. While a panel is
 * open the header is solid, even over the homepage slider.
 */
export default function MegaMenu({ categories }: { categories: MenuCategory[] }) {
  const { setMenuOpen } = useNav()
  const pathname = usePathname()
  const [openId, setOpenId] = useState<string | null>(null)
  // One stable object, so cleanup always sees the latest timers.
  const timers = useRef<{ open?: number; close?: number }>({})
  const listRef = useRef<HTMLUListElement>(null)

  const clearTimers = () => {
    window.clearTimeout(timers.current.open)
    window.clearTimeout(timers.current.close)
  }
  const openSoon = (id: string) => {
    clearTimers()
    // Moving between items switches at once; the first open waits a beat so
    // a pointer passing over the header does not flash a panel.
    timers.current.open = window.setTimeout(() => setOpenId(id), openId ? 0 : OPEN_DELAY_MS)
  }
  const closeSoon = () => {
    clearTimers()
    timers.current.close = window.setTimeout(() => setOpenId(null), CLOSE_DELAY_MS)
  }
  const close = () => {
    clearTimers()
    setOpenId(null)
  }

  useEffect(() => setMenuOpen(openId !== null), [openId, setMenuOpen])
  useEffect(() => setOpenId(null), [pathname])
  useEffect(() => {
    const pending = timers.current
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenId(null)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("keydown", onKey)
      window.clearTimeout(pending.open)
      window.clearTimeout(pending.close)
    }
  }, [])

  return (
    <ul
      ref={listRef}
      className="hidden h-full items-center small:flex"
      onMouseLeave={closeSoon}
      onBlur={(event) => {
        if (!listRef.current?.contains(event.relatedTarget as Node | null)) {
          close()
        }
      }}
    >
      {categories.map((category) => {
        const isOpen = openId === category.id
        const hasPanel = category.children.length > 0

        return (
          <li key={category.id} className="flex h-full items-center" onMouseEnter={() => openSoon(category.id)}>
            <LocalizedClientLink
              href={`/categories/${category.handle}`}
              onClick={close}
              onFocus={() => hasPanel && setOpenId(category.id)}
              aria-expanded={hasPanel ? isOpen : undefined}
              className="relative flex h-full items-center px-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:text-red-500"
            >
              {category.name}
              <span
                aria-hidden
                className={clx(
                  "absolute inset-x-3 bottom-0 h-[2px] origin-left bg-red-500 transition-transform duration-300",
                  isOpen ? "scale-x-100" : "scale-x-0"
                )}
              />
            </LocalizedClientLink>

            {hasPanel && (
              <div
                className={clx(
                  "absolute inset-x-0 top-full z-10 border-t border-paper-200 bg-paper text-ink shadow-[0_32px_64px_-32px_rgba(20,18,16,0.45)] transition-all duration-200",
                  isOpen
                    ? "visible translate-y-0 opacity-100"
                    : "pointer-events-none invisible -translate-y-1 opacity-0"
                )}
                onMouseEnter={() => openSoon(category.id)}
              >
                <Panel category={category} onNavigate={close} />
              </div>
            )}
          </li>
        )
      })}
      {/* Dims the page under an open panel; pointing at it closes the panel. */}
      <li
        aria-hidden
        className={clx(
          "absolute inset-x-0 top-full h-screen bg-ink/30 backdrop-blur-[2px] transition-opacity duration-200",
          openId ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onMouseEnter={closeSoon}
        onClick={close}
      />
    </ul>
  )
}
