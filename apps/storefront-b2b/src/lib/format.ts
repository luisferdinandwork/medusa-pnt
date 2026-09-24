export function formatRupiah(amount: number | null | undefined, currency = "idr") {
  if (amount == null) return "-"
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatTanggal(date: string | Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date))
}

// Only allow same-site relative paths as post-login redirect targets.
export function safeNext(next: FormDataEntryValue | string | null | undefined) {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
    ? next
    : "/"
}
