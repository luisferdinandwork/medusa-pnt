import { listCategories } from "@lib/data/categories"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

export default async function CategoryTiles() {
  const categories = (await listCategories()).filter((c) => !c.parent_category)

  if (!categories.length) {
    return null
  }

  return (
    <div className="content-container grid grid-cols-1 small:grid-cols-3 border-t border-paper-200">
      {categories.slice(0, 3).map((category) => (
        <LocalizedClientLink
          key={category.id}
          href={`/categories/${category.handle}`}
          className="group flex flex-col items-start gap-y-1 py-10 px-2 border-b small:border-b-0 small:border-r last:border-r-0 border-paper-200 hover:bg-paper-100 transition-colors"
        >
          <span className="text-xs text-ink-500 uppercase tracking-wide">
            Lihat semua
          </span>
          <span className="font-display text-2xl uppercase group-hover:text-red-500 transition-colors">
            {category.name}
          </span>
          <span className="text-red-500 text-sm mt-1">→</span>
        </LocalizedClientLink>
      ))}
    </div>
  )
}
