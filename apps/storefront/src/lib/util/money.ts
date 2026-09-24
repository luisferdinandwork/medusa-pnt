import { isEmpty } from "./isEmpty"

type ConvertToLocaleParams = {
  amount: number
  currency_code: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

// IDR is officially a 2-decimal currency in ISO 4217/CLDR, but Indonesian
// retail convention never shows sen - default it to 0 decimals like the
// spec's "Rp 599.000" unless the caller explicitly overrides.
const ZERO_DECIMAL_CURRENCIES = new Set(["idr"])

export const convertToLocale = ({
  amount,
  currency_code,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = "id-ID",
}: ConvertToLocaleParams) => {
  const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.has(
    currency_code?.toLowerCase()
  )

  return currency_code && !isEmpty(currency_code)
    ? new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency_code,
        minimumFractionDigits:
          minimumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
        maximumFractionDigits:
          maximumFractionDigits ?? (isZeroDecimal ? 0 : undefined),
      }).format(amount)
    : amount.toString()
}
