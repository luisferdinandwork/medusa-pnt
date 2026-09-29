import type { AmountRange, SaleList, SaleState } from "./types"

/** Minor digits the currency is priced in (IDR: 0, EUR: 2). */
export const currencyDecimals = (currencyCode: string) => {
  try {
    return (
      new Intl.NumberFormat("en", {
        style: "currency",
        currency: currencyCode.toUpperCase(),
      }).resolvedOptions().maximumFractionDigits ?? 2
    )
  } catch {
    return 2
  }
}

export const currencySymbol = (currencyCode: string) => {
  try {
    return (
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: currencyCode.toUpperCase(),
      })
        .formatToParts(0)
        .find((part) => part.type === "currency")?.value ?? currencyCode.toUpperCase()
    )
  } catch {
    return currencyCode.toUpperCase()
  }
}

export const formatMoney = (amount: number, currencyCode: string) => {
  const digits = currencyDecimals(currencyCode)
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currencyCode.toUpperCase(),
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amount)
}

export const formatRange = (range: AmountRange, currencyCode: string) =>
  range.min === range.max
    ? formatMoney(range.min, currencyCode)
    : `${formatMoney(range.min, currencyCode)} - ${formatMoney(range.max, currencyCode)}`

/**
 * Rounds a computed sale price the way shop prices are written: IDR to the
 * nearest hundred, other currencies to their minor unit.
 */
export const roundPrice = (amount: number, currencyCode: string) => {
  if (currencyCode.toLowerCase() === "idr") {
    return Math.round(amount / 100) * 100
  }
  const factor = 10 ** currencyDecimals(currencyCode)
  return Math.round(amount * factor) / factor
}

export const percentOff = (base: number, sale: number) =>
  base > 0 ? Math.round((1 - sale / base) * 100) : 0

export const formatDay = (value: string | Date | null | undefined) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null

export const SALE_STATE_LABEL: Record<SaleState, string> = {
  live: "Sale live",
  scheduled: "Sale scheduled",
  expired: "Sale ended",
  draft: "Sale paused",
}

export const SALE_STATE_COLOR: Record<SaleState, "green" | "blue" | "grey" | "orange"> = {
  live: "green",
  scheduled: "blue",
  expired: "grey",
  draft: "orange",
}

/** "until 31 Oct 2026", "from 1 Oct 2026", or "" when open-ended. */
export const salePeriodText = (sale: Pick<SaleList, "starts_at" | "ends_at" | "state">) => {
  const starts = formatDay(sale.starts_at)
  const ends = formatDay(sale.ends_at)
  if (sale.state === "scheduled" && starts) {
    return ends ? `${starts} - ${ends}` : `from ${starts}`
  }
  if (sale.state === "expired" && ends) {
    return `ended ${ends}`
  }
  return ends ? `until ${ends}` : "no end date"
}
