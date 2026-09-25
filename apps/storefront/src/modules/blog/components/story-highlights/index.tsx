import type { StoryHighlight } from "@lib/data/content"

export default function StoryHighlights({
  highlights,
}: {
  highlights: StoryHighlight[] | null
}) {
  if (!highlights?.length) {
    return null
  }

  return (
    <dl className="rounded-large border border-paper-200 bg-white divide-y divide-paper-100">
      {highlights.map((highlight, index) => (
        <div
          key={index}
          className="flex items-baseline justify-between gap-x-4 px-5 py-3"
        >
          <dt className="text-xs font-semibold uppercase tracking-widest text-ink-500">
            {highlight.label}
          </dt>
          <dd className="text-small-regular text-right font-medium">
            {highlight.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}
