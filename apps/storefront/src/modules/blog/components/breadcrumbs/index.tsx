import LocalizedClientLink from "@modules/common/components/localized-client-link"

export type Crumb = { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-x-2 text-xs uppercase tracking-widest text-ink-500">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-x-2">
            {index > 0 && (
              <span aria-hidden className="text-ink-500/40">
                /
              </span>
            )}
            {item.href ? (
              <LocalizedClientLink
                href={item.href}
                className="hover:text-red-500 transition-colors"
              >
                {item.label}
              </LocalizedClientLink>
            ) : (
              <span className="text-ink truncate max-w-[16rem]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
