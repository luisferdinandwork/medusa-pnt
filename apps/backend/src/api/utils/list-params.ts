import type { MedusaRequest } from "@medusajs/framework/http"

export type ListParams = {
  q?: string
  status?: string
  storefront_key?: string
  limit: number
  offset: number
  order: string
}

const toInt = (value: unknown, fallback: number, max: number) => {
  const parsed = Number.parseInt(String(value ?? ""), 10)
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback
  }
  return Math.min(parsed, max)
}

const toText = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : ""
  return text === "" ? undefined : text
}

// Shared list query parsing for the content admin endpoints. `order` is a
// Medusa sort string ("-updated_at" = descending).
export const parseListParams = (
  req: MedusaRequest,
  defaults: { order?: string } = {}
): ListParams => ({
  q: toText(req.query.q),
  status: toText(req.query.status),
  storefront_key: toText(req.query.storefront_key),
  limit: toInt(req.query.limit, 50, 200),
  offset: toInt(req.query.offset, 0, 100000),
  order: toText(req.query.order) ?? defaults.order ?? "-updated_at",
})

export const toOrderConfig = (order: string) =>
  order.startsWith("-")
    ? { [order.slice(1)]: "DESC" as const }
    : { [order]: "ASC" as const }

// Case-insensitive match across the fields an editor would search by.
export const searchFilter = (q: string | undefined, fields: string[]) =>
  q ? { $or: fields.map((field) => ({ [field]: { $ilike: `%${q}%` } })) } : {}
