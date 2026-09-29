"use client"

import { Popover, PopoverPanel, Transition } from "@headlessui/react"
import useToggleState from "@lib/hooks/use-toggle-state"
import { ArrowRightMini, XMark } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Text, clx } from "@modules/common/components/ui"
import { Fragment } from "react"
import CountrySelect from "../country-select"
import LanguageSelect from "../language-select"
import { Locale } from "@lib/data/locales"
import type { MenuCategory } from "@lib/util/category-tree"


const SideMenuItems = {
  Beranda: "/",
  Belanja: "/store",
  Akun: "/account",
  Tas: "/cart",
}

// Editorial pages are kept out of the header bar; they are reached from here
// and from the footer.
const EditorialItems = [
  { name: "Articles", href: "/blog", testId: "articles-link" },
  { name: "Product Stories", href: "/stories", testId: "product-stories-link" },
]

type SideMenuProps = {
  storeName: string
  regions: HttpTypes.StoreRegion[] | null
  locales: Locale[] | null
  currentLocale: string | null
  /** Main categories with their subcategories (same as the header menu). */
  categories: MenuCategory[]
}

const SideMenu = ({
  regions,
  locales,
  currentLocale,
  storeName,
  categories,
}: SideMenuProps) => {
  const countryToggleState = useToggleState()
  const languageToggleState = useToggleState()

  return (
    <div className="h-full">
      <div className="flex items-center h-full">
        <Popover className="h-full flex">
          {({ open, close }) => (
            <>
              <div className="relative flex h-full">
                <Popover.Button
                  data-testid="nav-menu-button"
                  className="relative h-full flex items-center transition-all ease-out duration-200 focus:outline-none hover:text-red-500 uppercase text-xs font-semibold tracking-wide"
                >
                  Menu
                </Popover.Button>
              </div>

              {open && (
                <div
                  className="fixed inset-0 z-[50] bg-black/0 pointer-events-auto"
                  onClick={close}
                  data-testid="side-menu-backdrop"
                />
              )}

              <Transition
                show={open}
                as={Fragment}
                enter="transition ease-out duration-150"
                enterFrom="opacity-0"
                enterTo="opacity-100 backdrop-blur-2xl"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 backdrop-blur-2xl"
                leaveTo="opacity-0"
              >
                <PopoverPanel className="flex flex-col absolute w-full pr-4 sm:pr-0 sm:w-1/3 2xl:w-1/4 sm:min-w-min h-[calc(100vh-1rem)] z-[51] inset-x-0 text-sm text-ui-fg-on-color m-2 backdrop-blur-2xl">
                  <div
                    data-testid="nav-menu-popup"
                    className="flex flex-col h-full bg-ink/90 rounded-rounded justify-between p-6 text-white"
                  >
                    <div className="flex justify-end" id="xmark">
                      <button data-testid="close-menu-button" onClick={close}>
                        <XMark />
                      </button>
                    </div>
                    <div className="no-scrollbar flex flex-col gap-y-10 overflow-y-auto">
                      {categories.length > 0 && (
                        <div className="flex flex-col gap-y-4">
                          <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                            Kategori
                          </span>
                          <ul className="flex flex-col">
                            {categories.map((category) => (
                              <li key={category.id} className="border-b border-white/10">
                                <details className="group/cat">
                                  <summary className="flex cursor-pointer list-none items-center justify-between py-3 font-display text-2xl uppercase hover:text-red-400 [&::-webkit-details-marker]:hidden">
                                    {category.name}
                                    <ArrowRightMini className="transition-transform duration-200 group-open/cat:rotate-90" />
                                  </summary>
                                  <ul className="grid grid-cols-2 gap-2 pb-4">
                                    {category.children.map((child) => (
                                      <li key={child.id}>
                                        <LocalizedClientLink
                                          href={`/categories/${child.handle}`}
                                          onClick={close}
                                          className="flex items-center gap-x-2 rounded-rounded bg-white/5 p-2 text-sm hover:bg-white/10"
                                        >
                                          {child.image && (
                                            <span className="h-10 w-10 shrink-0 overflow-hidden rounded bg-photo">
                                              {/* eslint-disable-next-line @next/next/no-img-element */}
                                              <img
                                                src={child.image}
                                                alt=""
                                                loading="lazy"
                                                className="h-full w-full object-contain mix-blend-darken"
                                              />
                                            </span>
                                          )}
                                          <span className="leading-tight">{child.name}</span>
                                        </LocalizedClientLink>
                                      </li>
                                    ))}
                                    <li className="col-span-2">
                                      <LocalizedClientLink
                                        href={`/categories/${category.handle}`}
                                        onClick={close}
                                        className="inline-flex items-center gap-x-1 text-xs font-semibold uppercase tracking-widest text-white/70 hover:text-red-400"
                                      >
                                        Lihat semua {category.name}
                                        <ArrowRightMini />
                                      </LocalizedClientLink>
                                    </li>
                                  </ul>
                                </details>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <ul className="flex flex-col gap-6 items-start justify-start">
                        {Object.entries(SideMenuItems).map(([name, href]) => {
                          return (
                            <li key={name}>
                              <LocalizedClientLink
                                href={href}
                                className="font-display uppercase text-3xl leading-10 hover:text-red-400"
                                onClick={close}
                                data-testid={`${name.toLowerCase()}-link`}
                              >
                                {name}
                              </LocalizedClientLink>
                            </li>
                          )
                        })}
                      </ul>
                      <div className="flex flex-col gap-y-4 border-t border-white/15 pt-6">
                        <span className="text-xs font-semibold uppercase tracking-widest text-white/50">
                          Editorial
                        </span>
                        <ul className="flex flex-col gap-y-3 items-start">
                          {EditorialItems.map((item) => (
                            <li key={item.href}>
                              <LocalizedClientLink
                                href={item.href}
                                className="group flex items-center gap-x-2 font-display uppercase text-xl hover:text-red-400"
                                onClick={close}
                                data-testid={item.testId}
                              >
                                {item.name}
                                <ArrowRightMini className="transition-transform group-hover:translate-x-1" />
                              </LocalizedClientLink>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    <div className="flex flex-col gap-y-6">
                      {!!locales?.length && (
                        <div
                          className="flex justify-between"
                          onMouseEnter={languageToggleState.open}
                          onMouseLeave={languageToggleState.close}
                        >
                          <LanguageSelect
                            toggleState={languageToggleState}
                            locales={locales}
                            currentLocale={currentLocale}
                          />
                          <ArrowRightMini
                            className={clx(
                              "transition-transform duration-150",
                              languageToggleState.state ? "-rotate-90" : ""
                            )}
                          />
                        </div>
                      )}
                      <div
                        className="flex justify-between"
                        onMouseEnter={countryToggleState.open}
                        onMouseLeave={countryToggleState.close}
                      >
                        {regions && (
                          <CountrySelect
                            toggleState={countryToggleState}
                            regions={regions}
                          />
                        )}
                        <ArrowRightMini
                          className={clx(
                            "transition-transform duration-150",
                            countryToggleState.state ? "-rotate-90" : ""
                          )}
                        />
                      </div>
                      <Text className="flex justify-between txt-compact-small">
                        © {new Date().getFullYear()} {storeName}. Hak
                        cipta dilindungi.
                      </Text>
                    </div>
                  </div>
                </PopoverPanel>
              </Transition>
            </>
          )}
        </Popover>
      </div>
    </div>
  )
}

export default SideMenu
