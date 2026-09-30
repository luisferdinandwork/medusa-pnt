import { formatGatewayMethod, isGatewayProvider } from "@lib/constants"
import { retrieveCart } from "@lib/data/cart"
import { convertToLocale } from "@lib/util/money"
import PaymentPendingPoller from "@modules/checkout/components/payment-pending-poller"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Heading, Text } from "@modules/common/components/ui"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Menunggu pembayaran",
}

type Props = {
  params: Promise<{ countryCode: string }>
}

type GatewaySessionData = {
  gateway_name?: string
  redirect_url?: string
  expires_at?: string | null
  payment_method?: string | null
}

const formatDeadline = (value: string) =>
  new Date(value).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  })

// Where a Midtrans / DOKU shopper lands while the payment is still open,
// e.g. after a VA number was issued. The order is placed as soon as the
// gateway reports the transfer.
export default async function PaymentPendingPage(props: Props) {
  const { countryCode } = await props.params
  const cart = await retrieveCart(
    undefined,
    "id,total,currency_code,payment_collection.payment_sessions.provider_id,payment_collection.payment_sessions.status,payment_collection.payment_sessions.data"
  )
  const session = cart?.payment_collection?.payment_sessions?.find((item) =>
    isGatewayProvider(item.provider_id)
  )
  const data = (session?.data ?? {}) as GatewaySessionData

  if (!cart || !session) {
    return (
      <div className="content-container flex flex-col items-center gap-y-4 py-24 text-center">
        <Heading level="h1" className="text-2xl-semi">
          Tidak ada pembayaran yang menunggu
        </Heading>
        <Text className="text-ui-fg-subtle max-w-md">
          Kalau kamu sudah membayar, pesananmu akan muncul di akun dan email
          konfirmasi dikirim begitu pembayaran diterima.
        </Text>
        <LocalizedClientLink href="/account/orders" className="text-ui-fg-interactive underline">
          Lihat pesanan saya
        </LocalizedClientLink>
      </div>
    )
  }

  const expired = !!data.expires_at && new Date(data.expires_at).getTime() <= Date.now()

  return (
    <div className="content-container flex justify-center py-12 small:py-20">
      <div className="flex w-full max-w-lg flex-col gap-y-6 rounded-rounded border border-paper-200 bg-white p-6 small:p-10">
        <div className="flex flex-col gap-y-2">
          <Text className="text-small-semi uppercase tracking-wide text-ink-500">
            {data.gateway_name ?? "Pembayaran online"}
          </Text>
          <Heading level="h1" className="text-3xl-regular">
            Menunggu pembayaran
          </Heading>
          <Text className="text-ui-fg-subtle">
            Selesaikan pembayaran sesuai instruksi di halaman pembayaran. Pesanan
            dibuat otomatis begitu pembayaran kami terima.
          </Text>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-base-regular">
          <dt className="text-ui-fg-subtle">Total</dt>
          <dd className="text-right font-semibold" data-testid="pending-total">
            {convertToLocale({ amount: cart.total ?? 0, currency_code: cart.currency_code })}
          </dd>
          {data.payment_method && (
            <>
              <dt className="text-ui-fg-subtle">Metode</dt>
              <dd className="text-right">{formatGatewayMethod(data.payment_method)}</dd>
            </>
          )}
          {data.expires_at && (
            <>
              <dt className="text-ui-fg-subtle">Bayar sebelum</dt>
              <dd className={expired ? "text-right text-red-600" : "text-right"}>
                {expired ? "Sudah kedaluwarsa" : formatDeadline(data.expires_at)}
              </dd>
            </>
          )}
        </dl>

        <div className="flex flex-col gap-y-3">
          {data.redirect_url && !expired && (
            <a
              href={data.redirect_url}
              className="flex h-12 items-center justify-center rounded-rounded bg-ink px-4 text-small-semi uppercase text-white hover:bg-ink-700"
              data-testid="open-payment-page"
            >
              Lihat instruksi pembayaran
            </a>
          )}
          <PaymentPendingPoller cartId={cart.id} countryCode={countryCode} />
          <LocalizedClientLink
            href="/checkout?step=payment"
            className="text-center text-small-regular text-ui-fg-interactive hover:underline"
          >
            Ganti metode pembayaran
          </LocalizedClientLink>
        </div>
      </div>
    </div>
  )
}
