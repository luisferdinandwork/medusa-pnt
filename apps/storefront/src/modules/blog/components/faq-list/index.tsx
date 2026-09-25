import type { Faq } from "@lib/data/content"

/**
 * Native <details> so the answers are in the HTML even before hydration -
 * crawlers and answer engines read them, and the page works without JS.
 */
export default function FaqList({
  faqs,
  title = "Pertanyaan umum",
}: {
  faqs: Faq[] | null
  title?: string
}) {
  if (!faqs?.length) {
    return null
  }

  return (
    <section className="flex flex-col gap-y-5">
      <h2 className="font-display uppercase text-2xl small:text-3xl">{title}</h2>
      <div className="divide-y divide-paper-200 border-y border-paper-200">
        {faqs.map((faq, index) => (
          <details key={index} className="group py-4">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-x-4">
              <h3 className="text-base font-semibold leading-snug">
                {faq.question}
              </h3>
              <span
                aria-hidden
                className="mt-1 shrink-0 text-red-500 transition-transform group-open:rotate-45"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M8 3.5v9M3.5 8h9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </summary>
            <p className="text-small-regular text-ink-500 leading-relaxed pt-3 pr-8">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
