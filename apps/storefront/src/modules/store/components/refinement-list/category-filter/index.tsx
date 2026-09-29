import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { clx } from "@modules/common/components/ui"

import FilterSection from "../filter-section"

export type CategoryFilterItem = {
  id: string
  name: string
  handle: string
  count: number
  /** Subcategories, listed under the main category while it is browsed. */
  children?: { id: string; name: string; handle: string }[]
}

type CategoryFilterProps = {
  categories: CategoryFilterItem[]
  currentHandle?: string
}

const CategoryFilter = ({ categories, currentHandle }: CategoryFilterProps) => {
  if (!categories.length) {
    return null
  }

  return (
    <FilterSection title="Kategori">
      <ul className="flex flex-col gap-y-3">
        <li>
          <LocalizedClientLink
            href="/store"
            className={clx(
              "text-sm transition-colors",
              !currentHandle
                ? "font-semibold text-ink"
                : "text-ink-500 hover:text-ink"
            )}
          >
            Semua Produk
          </LocalizedClientLink>
        </li>
        {categories.map((category) => {
          const active = category.handle === currentHandle
          const children = category.children ?? []
          const inBranch =
            active || children.some((child) => child.handle === currentHandle)

          return (
            <li key={category.id}>
              <LocalizedClientLink
                href={`/categories/${category.handle}`}
                className={clx(
                  "flex items-center justify-between gap-x-2 text-sm transition-colors",
                  active ? "font-semibold text-ink" : "text-ink-500 hover:text-ink"
                )}
              >
                <span>{category.name}</span>
                <span className="text-xs text-ink-500/60">
                  ({category.count})
                </span>
              </LocalizedClientLink>
              {inBranch && children.length > 0 && (
                <ul className="mt-3 flex flex-col gap-y-2.5 border-l border-paper-200 pl-3">
                  {children.map((child) => (
                    <li key={child.id}>
                      <LocalizedClientLink
                        href={`/categories/${child.handle}`}
                        className={clx(
                          "text-sm transition-colors",
                          child.handle === currentHandle
                            ? "font-semibold text-ink"
                            : "text-ink-500 hover:text-ink"
                        )}
                      >
                        {child.name}
                      </LocalizedClientLink>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}
      </ul>
    </FilterSection>
  )
}

export default CategoryFilter
