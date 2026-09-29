import {
  ArrowDownMini,
  ArrowUpMini,
  Plus,
  Trash,
  XMarkMini,
} from "@medusajs/icons"
import { Button, IconButton, Input, Text, Textarea } from "@medusajs/ui"
import { useState } from "react"
import { ImageUpload } from "./image-upload"

const move = <T,>(items: T[], from: number, to: number) => {
  if (to < 0 || to >= items.length) {
    return items
  }
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Chips for a list of short strings (tags, keywords). Enter or comma commits
 * the value, backspace on an empty field removes the last chip.
 */
export const ChipList = ({
  value,
  onChange,
  placeholder,
}: {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
}) => {
  const [draft, setDraft] = useState("")

  const commit = () => {
    const entry = draft.trim().replace(/,$/, "")
    if (entry && !value.includes(entry)) {
      onChange([...value, entry])
    }
    setDraft("")
  }

  return (
    <div className="flex flex-col gap-y-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((entry) => (
            <span
              key={entry}
              className="bg-ui-bg-subtle border-ui-border-base txt-compact-xsmall inline-flex items-center gap-x-1 rounded-md border py-0.5 pl-2 pr-1"
            >
              {entry}
              <button
                type="button"
                aria-label={`Hapus ${entry}`}
                className="text-ui-fg-muted hover:text-ui-fg-base"
                onClick={() => onChange(value.filter((item) => item !== entry))}
              >
                <XMarkMini />
              </button>
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        placeholder={placeholder ?? "Ketik lalu tekan Enter"}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            commit()
          }
          if (event.key === "Backspace" && draft === "" && value.length) {
            onChange(value.slice(0, -1))
          }
        }}
      />
    </div>
  )
}

/** Ordered list of one-line strings, e.g. the GEO key takeaways. */
export const LineList = ({
  value,
  onChange,
  addLabel,
  placeholder,
  max = 10,
}: {
  value: string[]
  onChange: (value: string[]) => void
  addLabel: string
  placeholder?: string
  max?: number
}) => (
  <div className="flex flex-col gap-y-2">
    {value.map((entry, index) => (
      <div key={index} className="flex items-start gap-x-2">
        <Text
          size="small"
          className="text-ui-fg-muted w-5 shrink-0 pt-2 text-right tabular-nums"
        >
          {index + 1}
        </Text>
        <Textarea
          rows={2}
          value={entry}
          placeholder={placeholder}
          onChange={(event) =>
            onChange(
              value.map((item, i) => (i === index ? event.target.value : item))
            )
          }
        />
        <div className="flex shrink-0 flex-col gap-y-1">
          <IconButton
            size="small"
            variant="transparent"
            aria-label="Naik"
            disabled={index === 0}
            onClick={() => onChange(move(value, index, index - 1))}
          >
            <ArrowUpMini />
          </IconButton>
          <IconButton
            size="small"
            variant="transparent"
            aria-label="Turun"
            disabled={index === value.length - 1}
            onClick={() => onChange(move(value, index, index + 1))}
          >
            <ArrowDownMini />
          </IconButton>
          <IconButton
            size="small"
            variant="transparent"
            aria-label="Hapus"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
          >
            <Trash />
          </IconButton>
        </div>
      </div>
    ))}
    <Button
      size="small"
      variant="secondary"
      className="w-fit"
      disabled={value.length >= max}
      onClick={() => onChange([...value, ""])}
    >
      <Plus />
      {addLabel}
    </Button>
  </div>
)

type FieldSpec<T> = {
  key: keyof T & string
  label: string
  placeholder?: string
  /**
   * "input" is a single line, "textarea" a multi-line body, "image" an upload
   * that stores the file URL.
   */
  type?: "input" | "textarea" | "image"
  rows?: number
  /** For "image": the field holding the alt text, used for the preview. */
  altKey?: keyof T & string
}

/**
 * Ordered list of small objects (FAQ pairs, sources, story sections). Each row
 * can be reordered or removed; `template` supplies a blank entry.
 */
export const RecordList = <T extends Record<string, string>>({
  value,
  onChange,
  fields,
  template,
  addLabel,
  emptyLabel,
  max = 20,
}: {
  value: T[]
  onChange: (value: T[]) => void
  fields: FieldSpec<T>[]
  template: T
  addLabel: string
  emptyLabel: string
  max?: number
}) => (
  <div className="flex flex-col gap-y-3">
    {value.length === 0 && (
      <div className="border-ui-border-strong rounded-lg border border-dashed px-4 py-6 text-center">
        <Text size="small" className="text-ui-fg-subtle">
          {emptyLabel}
        </Text>
      </div>
    )}
    {value.map((entry, index) => (
      <div
        key={index}
        className="bg-ui-bg-subtle border-ui-border-base flex flex-col gap-y-3 rounded-lg border p-3"
      >
        <div className="flex items-center justify-between">
          <Text size="xsmall" weight="plus" className="text-ui-fg-muted">
            #{index + 1}
          </Text>
          <div className="flex items-center gap-x-1">
            <IconButton
              size="small"
              variant="transparent"
              aria-label="Naik"
              disabled={index === 0}
              onClick={() => onChange(move(value, index, index - 1))}
            >
              <ArrowUpMini />
            </IconButton>
            <IconButton
              size="small"
              variant="transparent"
              aria-label="Turun"
              disabled={index === value.length - 1}
              onClick={() => onChange(move(value, index, index + 1))}
            >
              <ArrowDownMini />
            </IconButton>
            <IconButton
              size="small"
              variant="transparent"
              aria-label="Hapus"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
            >
              <Trash />
            </IconButton>
          </div>
        </div>
        {fields.map((field) => {
          const update = (next: string) =>
            onChange(
              value.map((item, i) =>
                i === index ? { ...item, [field.key]: next } : item
              )
            )

          return (
            <div key={field.key} className="flex flex-col gap-y-1">
              <Text size="xsmall" weight="plus" className="text-ui-fg-subtle">
                {field.label}
              </Text>
              {field.type === "image" ? (
                <ImageUpload
                  value={entry[field.key] ?? ""}
                  onChange={update}
                  alt={field.altKey ? entry[field.altKey] : undefined}
                />
              ) : field.type === "textarea" ? (
                <Textarea
                  rows={field.rows ?? 3}
                  value={entry[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => update(event.target.value)}
                />
              ) : (
                <Input
                  value={entry[field.key] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => update(event.target.value)}
                />
              )}
            </div>
          )
        })}
      </div>
    ))}
    <Button
      size="small"
      variant="secondary"
      className="w-fit"
      disabled={value.length >= max}
      onClick={() => onChange([...value, { ...template }])}
    >
      <Plus />
      {addLabel}
    </Button>
  </div>
)
