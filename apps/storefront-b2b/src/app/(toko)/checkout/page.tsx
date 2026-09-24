import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { AddressForm } from "@/components/checkout/address-form"
import { StepSection } from "@/components/checkout/step-section"
import { OrderSummary } from "@/components/order-summary"
import { StepForm } from "@/components/step-form"
import { placeOrder, setPaymentMethod, setShippingMethod } from "@/lib/actions/cart"
import {
  getActivePaymentSession,
  isAddressDone,
  isPaymentDone,
  isShippingDone,
  isSupportedProvider,
  paymentTitle,
  resolveStep,
  STEP_TITLES,
} from "@/lib/checkout"
import { getCart, listPaymentProviders, listShippingOptions } from "@/lib/data/cart"
import { requireCustomer } from "@/lib/data/customer"
import { formatRupiah } from "@/lib/format"

export const metadata: Metadata = { title: "Checkout" }

type Props = { searchParams: Promise<{ step?: string }> }

export default async function CheckoutPage({ searchParams }: Props) {
  const cart = await getCart()
  if (!cart || !cart.items?.length) redirect("/keranjang")

  const { step: requestedStep } = await searchParams
  const customer = await requireCustomer()
  const step = resolveStep(requestedStep, cart)

  const currency = cart.currency_code
  const shippingAddress = cart.shipping_address
  const billingAddress = cart.billing_address
  const shippingMethod = cart.shipping_methods?.[0]
  const activeSession = getActivePaymentSession(cart)

  const options = step === "pengiriman" ? await listShippingOptions(cart.id) : []
  const providers =
    step === "pembayaran"
      ? (await listPaymentProviders(cart.region_id ?? "")).filter((p) => isSupportedProvider(p.id))
      : []

  const done = {
    alamat: isAddressDone(cart),
    pengiriman: isShippingDone(cart),
    pembayaran: isPaymentDone(cart),
    tinjau: false,
  }

  return (
    <>
      <Link href="/keranjang" className="text-sm text-ink-500 hover:text-brand">&larr; Kembali ke keranjang</Link>
      <h1 className="mb-6 mt-2 font-display text-3xl uppercase">Checkout</h1>

      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <StepSection
            number={1}
            step="alamat"
            title={STEP_TITLES.alamat}
            open={step === "alamat"}
            complete={done.alamat}
            summary={
              shippingAddress && (
                <div className="grid gap-4 sm:grid-cols-3">
                  <address className="not-italic" data-testid="shipping-address-summary">
                    <p className="font-semibold text-ink">Alamat pengiriman</p>
                    {shippingAddress.first_name} {shippingAddress.last_name}
                    {shippingAddress.company && <><br />{shippingAddress.company}</>}
                    <br />{shippingAddress.address_1}
                    <br />{shippingAddress.city}, {shippingAddress.province} {shippingAddress.postal_code}
                  </address>
                  <div>
                    <p className="font-semibold text-ink">Kontak</p>
                    {shippingAddress.phone}
                    <br />{cart.email}
                  </div>
                  <div>
                    <p className="font-semibold text-ink">Alamat penagihan</p>
                    {billingAddress && billingAddress.address_1 === shippingAddress.address_1
                      ? "Sama dengan alamat pengiriman."
                      : billingAddress
                        ? `${billingAddress.address_1}, ${billingAddress.city}`
                        : "-"}
                  </div>
                </div>
              )
            }
          >
            <AddressForm
              email={cart.email ?? customer.email}
              savedAddresses={customer.addresses ?? []}
              shipping={shippingAddress ?? null}
              billing={billingAddress ?? null}
              profile={{
                first_name: customer.first_name,
                last_name: customer.last_name,
                phone: customer.phone,
                company: customer.company_name,
              }}
            />
          </StepSection>

          <StepSection
            number={2}
            step="pengiriman"
            title={STEP_TITLES.pengiriman}
            open={step === "pengiriman"}
            complete={done.pengiriman}
            summary={
              shippingMethod && (
                <p data-testid="shipping-method-summary">
                  <span className="font-semibold text-ink">{shippingMethod.name}</span>{" "}
                  ({shippingMethod.amount ? formatRupiah(shippingMethod.amount, currency) : "Gratis"})
                </p>
              )
            }
          >
            {options.length === 0 ? (
              <p className="text-sm text-brand-700">Belum ada metode pengiriman yang tersedia untuk alamat ini.</p>
            ) : (
              <StepForm action={setShippingMethod} submitLabel="Lanjut ke pembayaran" pendingLabel="Menyimpan...">
                <ul className="space-y-2">
                  {options.map((option, index) => (
                    <li key={option.id}>
                      <label className="flex cursor-pointer items-center justify-between gap-4 rounded border border-paper-200 bg-white px-4 py-3 text-sm has-[:checked]:border-ink">
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="option_id"
                            value={option.id}
                            defaultChecked={
                              shippingMethod ? shippingMethod.shipping_option_id === option.id : index === 0
                            }
                          />
                          <span>
                            {option.name}
                            {option.is_pickup && (
                              <span className="ml-2 rounded bg-paper-100 px-2 py-0.5 text-xs">
                                Ambil sendiri{option.pickup_address ? `: ${option.pickup_address}` : ""}
                              </span>
                            )}
                          </span>
                        </span>
                        <span className="font-semibold">
                          {option.amount ? formatRupiah(option.amount, currency) : "Gratis"}
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </StepForm>
            )}
          </StepSection>

          <StepSection
            number={3}
            step="pembayaran"
            title={STEP_TITLES.pembayaran}
            open={step === "pembayaran"}
            complete={done.pembayaran}
            summary={
              <p data-testid="payment-method-summary">
                {activeSession ? paymentTitle(activeSession.provider_id) : "Tidak perlu pembayaran"}
              </p>
            }
          >
            {providers.length === 0 ? (
              <p className="text-sm text-brand-700">Belum ada metode pembayaran yang tersedia.</p>
            ) : (
              <StepForm action={setPaymentMethod} submitLabel="Lanjut ke tinjauan" pendingLabel="Menyimpan...">
                <ul className="space-y-2">
                  {providers.map((provider, index) => (
                    <li key={provider.id}>
                      <label className="flex cursor-pointer items-center gap-3 rounded border border-paper-200 bg-white px-4 py-3 text-sm has-[:checked]:border-ink">
                        <input
                          type="radio"
                          name="provider_id"
                          value={provider.id}
                          defaultChecked={activeSession ? activeSession.provider_id === provider.id : index === 0}
                        />
                        <span>
                          {paymentTitle(provider.id)}
                          <span className="block text-xs text-ink-500">
                            Invoice dan instruksi transfer dikirim setelah pesanan diterima.
                          </span>
                        </span>
                      </label>
                    </li>
                  ))}
                </ul>
              </StepForm>
            )}
          </StepSection>

          <StepSection
            number={4}
            step="tinjau"
            title={STEP_TITLES.tinjau}
            open={step === "tinjau"}
            complete={false}
          >
            <p className="mb-4 text-sm text-ink-500">
              Dengan menekan tombol Buat pesanan, Anda menyetujui syarat &amp; ketentuan penjualan grosir. Total pembayaran{" "}
              <span className="font-semibold text-ink">{formatRupiah(cart.total, currency)}</span>.
            </p>
            <StepForm action={placeOrder} submitLabel="Buat pesanan" pendingLabel="Membuat pesanan..." />
          </StepSection>
        </div>

        <OrderSummary cart={cart} />
      </div>
    </>
  )
}
