/**
 * The answer-first block: a direct answer plus the bullets that summarise it.
 * Placed above the article body because both readers in a hurry and answer
 * engines look at the top of the page first.
 */
export default function AnswerBox({
  summary,
  takeaways,
}: {
  summary: string | null
  takeaways: string[] | null
}) {
  const points = takeaways ?? []

  if (!summary && points.length === 0) {
    return null
  }

  return (
    <aside className="rounded-large border border-paper-200 bg-white p-6 small:p-8 flex flex-col gap-y-5">
      <div className="flex items-center gap-x-2">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-red-500" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-red-500">
          Jawaban singkat
        </h2>
      </div>
      {summary && <p className="text-ink leading-relaxed">{summary}</p>}
      {points.length > 0 && (
        <ul className="flex flex-col gap-y-3 border-t border-paper-100 pt-5">
          {points.map((point, index) => (
            <li key={index} className="flex gap-x-3">
              <span className="font-display text-xs text-red-500 pt-1 tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="text-small-regular text-ink-500 leading-relaxed">
                {point}
              </span>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
