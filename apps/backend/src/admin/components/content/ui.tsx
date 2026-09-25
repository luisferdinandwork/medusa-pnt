import { Heading, Label, StatusBadge, Text } from "@medusajs/ui"
import type { ReactNode } from "react"

/** Lowercase, hyphenated slug used as the public handle of a piece of content. */
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120)

export const blankToNull = (value: string) =>
  value.trim() === "" ? null : value.trim()

export const wordCount = (value: string) =>
  value.trim() === "" ? 0 : value.trim().split(/\s+/).length

/** Reading time at ~200 words per minute, the figure most blogs quote. */
export const estimateReadMinutes = (value: string) =>
  Math.max(1, Math.round(wordCount(value) / 200))

export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) {
    return "-"
  }
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

export const SectionCard = ({
  title,
  description,
  actions,
  children,
}: {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}) => (
  <div className="bg-ui-bg-base shadow-elevation-card-rest rounded-lg divide-y">
    <div className="flex items-start justify-between gap-x-4 px-6 py-4">
      <div>
        <Heading level="h2">{title}</Heading>
        {description && (
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {description}
          </Text>
        )}
      </div>
      {actions}
    </div>
    <div className="flex flex-col gap-y-4 px-6 py-4">{children}</div>
  </div>
)

export const Field = ({
  label,
  hint,
  optional,
  counter,
  children,
}: {
  label: string
  hint?: string
  optional?: boolean
  /** [current, recommended max] - turns amber past the limit. */
  counter?: [number, number]
  children: ReactNode
}) => (
  <div className="flex flex-col gap-y-1.5">
    <div className="flex items-center justify-between gap-x-2">
      <Label size="small" weight="plus">
        {label}
        {optional && (
          <span className="text-ui-fg-muted font-normal"> (opsional)</span>
        )}
      </Label>
      {counter && (
        <Text
          size="xsmall"
          className={
            counter[0] > counter[1] ? "text-ui-tag-orange-text" : "text-ui-fg-muted"
          }
        >
          {counter[0]}/{counter[1]}
        </Text>
      )}
    </div>
    {children}
    {hint && (
      <Text size="xsmall" className="text-ui-fg-subtle">
        {hint}
      </Text>
    )}
  </div>
)

export const PublishBadge = ({ status }: { status: string }) => (
  <StatusBadge color={status === "published" ? "green" : "grey"}>
    {status === "published" ? "Terbit" : "Draf"}
  </StatusBadge>
)
