import type { Source } from "@lib/data/content"

export default function SourcesList({ sources }: { sources: Source[] | null }) {
  if (!sources?.length) {
    return null
  }

  return (
    <section className="flex flex-col gap-y-3 border-t border-paper-200 pt-6">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-ink-500">
        Sumber
      </h2>
      <ul className="flex flex-col gap-y-2">
        {sources.map((source, index) => (
          <li key={index} className="text-small-regular">
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-ink-500 hover:text-red-500 transition-colors underline underline-offset-4 decoration-paper-200"
            >
              {source.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
