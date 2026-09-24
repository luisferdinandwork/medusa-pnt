import Link from "next/link"

// One collapsible checkout step: the form when open, a summary plus an "Ubah"
// link once completed, dimmed until earlier steps are done.
export function StepSection({
  number,
  title,
  open,
  complete,
  step,
  summary,
  children,
}: {
  number: number
  title: string
  open: boolean
  complete: boolean
  step: string
  summary?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section
      className={`rounded-lg border border-paper-200 bg-white p-5 ${!open && !complete ? "opacity-50" : ""}`}
      data-testid={`step-${step}`}
      data-state={open ? "open" : complete ? "done" : "locked"}
    >
      <header className="flex items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 font-bold">
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs ${
              complete && !open ? "bg-ink text-paper" : "border border-ink"
            }`}
          >
            {complete && !open ? "✓" : number}
          </span>
          {title}
        </h2>
        {complete && !open && (
          <Link href={`/checkout?step=${step}`} className="text-sm font-semibold text-brand hover:text-brand-600">
            Ubah
          </Link>
        )}
      </header>

      {open ? (
        <div className="mt-5">{children}</div>
      ) : complete && summary ? (
        <div className="mt-4 text-sm text-ink-500">{summary}</div>
      ) : null}
    </section>
  )
}
