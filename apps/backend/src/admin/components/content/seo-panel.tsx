import { CheckCircleSolid, XCircle } from "@medusajs/icons"
import { Text } from "@medusajs/ui"

/** Approximation of a Google result, so an editor can see the copy in place. */
export const SerpPreview = ({
  url,
  title,
  description,
}: {
  url: string
  title: string
  description: string
}) => (
  <div className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-1 rounded-lg border p-3">
    <Text size="xsmall" className="text-ui-fg-muted truncate">
      {url}
    </Text>
    <span className="line-clamp-2 text-[16px] leading-[1.35] text-[#1a0dab]">
      {title || "Judul belum diisi"}
    </span>
    <Text size="small" className="text-ui-fg-subtle line-clamp-2">
      {description || "Deskripsi belum diisi."}
    </Text>
  </div>
)

export type SeoCheck = {
  label: string
  ok: boolean
  hint?: string
}

/**
 * A short, opinionated checklist. Each item maps to something a crawler or an
 * answer engine actually reads, so passing all of them is worth the effort.
 */
export const SeoChecklist = ({ checks }: { checks: SeoCheck[] }) => {
  const passed = checks.filter((check) => check.ok).length
  const percent = checks.length
    ? Math.round((passed / checks.length) * 100)
    : 0

  return (
    <div className="flex flex-col gap-y-3">
      <div className="flex items-center gap-x-3">
        <div className="bg-ui-bg-subtle h-1.5 flex-1 overflow-hidden rounded-full">
          <div
            className={
              percent === 100
                ? "bg-ui-tag-green-icon h-full rounded-full transition-all"
                : "bg-ui-fg-muted h-full rounded-full transition-all"
            }
            style={{ width: `${percent}%` }}
          />
        </div>
        <Text size="small" weight="plus" className="shrink-0 tabular-nums">
          {passed}/{checks.length}
        </Text>
      </div>
      <ul className="flex flex-col gap-y-1.5">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-x-2">
            <span className="mt-0.5 shrink-0">
              {check.ok ? (
                <span className="text-ui-tag-green-icon">
                  <CheckCircleSolid />
                </span>
              ) : (
                <span className="text-ui-fg-muted">
                  <XCircle />
                </span>
              )}
            </span>
            <div className="min-w-0">
              <Text
                size="small"
                className={check.ok ? "text-ui-fg-base" : "text-ui-fg-subtle"}
              >
                {check.label}
              </Text>
              {!check.ok && check.hint && (
                <Text size="xsmall" className="text-ui-fg-muted">
                  {check.hint}
                </Text>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
