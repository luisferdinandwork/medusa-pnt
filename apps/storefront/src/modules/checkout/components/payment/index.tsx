"use client"
import { RadioGroup } from "@headlessui/react"
import { isGatewayProvider, isStripeLike, paymentInfoMap } from "@lib/constants"
import { initiatePaymentSession } from "@lib/data/cart"
import type { StorePaymentGateway } from "@lib/data/payment"
import {
  GATEWAY_METHOD_GROUPS,
  type GatewayOption,
  buildGatewayOptions,
} from "@lib/util/gateway-methods"
import { CheckCircleSolid, CreditCard } from "@medusajs/icons"
import ErrorMessage from "@modules/checkout/components/error-message"
import PaymentContainer, {
  GatewayMethodIcon,
  GatewayPaymentContainer,
  StripePaymentContainer,
} from "@modules/checkout/components/payment-container"
import Divider from "@modules/common/components/divider"
import {
  Button,
  Container,
  Heading,
  Text,
  clx,
} from "@modules/common/components/ui"
import { HttpTypes } from "@medusajs/types"
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"

// Where the gateway returns to: checks the payment and places the order.
const gatewayReturnUrl = (cartId: string, countryCode: string) =>
  `${window.location.origin}/api/payment-gateway/return?${new URLSearchParams({
    cart_id: cartId,
    country_code: countryCode,
  })}`

const Payment = ({
  cart,
  availablePaymentMethods,
  paymentGateways = [],
}: {
  cart: HttpTypes.StoreCart
  availablePaymentMethods: { id: string }[]
  paymentGateways?: StorePaymentGateway[]
}) => {
  const activeSession = cart.payment_collection?.payment_sessions?.find(
    (paymentSession) => paymentSession.status === "pending"
  )

  // Gateways (Midtrans / DOKU) are listed by payment method (BCA VA, QRIS...)
  // instead of by provider; a gateway that allows every method is one option.
  // They charge in rupiah only; the backend enables their provider in every
  // IDR region. (The region's provider list is cached by the storefront, so
  // it can lag behind a gateway turned on in the admin.)
  const gateways =
    cart.currency_code?.toLowerCase() === "idr" ? paymentGateways : []
  const gatewayOptions = buildGatewayOptions(gateways)
  const methodGroups = GATEWAY_METHOD_GROUPS.map((group) => ({
    ...group,
    options: gatewayOptions.filter((option) => option.group === group.id),
  })).filter((group) => group.options.length)
  const ungroupedOptions = gatewayOptions.filter((option) => !option.group)
  const otherMethods = availablePaymentMethods.filter(
    (method) => !isGatewayProvider(method.id)
  )

  const activeSessionData = activeSession?.data as
    | { gateway_id?: string; selected_method?: string }
    | undefined
  const activeGateway = isGatewayProvider(activeSession?.provider_id)
    ? gateways.find((gateway) => gateway.id === activeSessionData?.gateway_id)
    : undefined
  const activeGatewayOption = activeGateway
    ? gatewayOptions.find(
        (option) =>
          option.gateway.id === activeGateway.id &&
          option.method === (activeSessionData?.selected_method ?? null)
      )
    : undefined
  const activeOption = activeGatewayOption?.value ?? activeSession?.provider_id ?? ""

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentComplete, setPaymentComplete] = useState(false)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(activeOption)
  const selectedGatewayOption = gatewayOptions.find(
    (option) => option.value === selectedPaymentMethod
  )

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { countryCode } = useParams() as { countryCode: string }

  const isOpen = searchParams.get("step") === "payment"
  const gatewayFailed = searchParams.get("payment_status") === "failed"

  const setPaymentMethod = async (method: string) => {
    setError(null)
    setSelectedPaymentMethod(method)
    if (isStripeLike(method)) {
      await initiatePaymentSession(cart, {
        provider_id: method,
      })
    }
  }

  const paidByGiftcard = !!(
    (cart as unknown as Record<string, unknown>)?.gift_cards && ((cart as unknown as Record<string, unknown>)?.gift_cards as unknown[])?.length > 0 && cart?.total === 0
  )

  const paymentReady =
    (activeSession && (cart?.shipping_methods?.length ?? 0) !== 0) || paidByGiftcard

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams)
      params.set(name, value)
      params.delete("payment_status")

      return params.toString()
    },
    [searchParams]
  )

  const handleEdit = () => {
    router.push(pathname + "?" + createQueryString("step", "payment"), {
      scroll: false,
    })
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      const shouldInputPaymentDetails =
        isStripeLike(selectedPaymentMethod) && !activeSession

      const checkActiveSession = selectedGatewayOption
        ? activeGatewayOption?.value === selectedGatewayOption.value
        : activeSession?.provider_id === selectedPaymentMethod

      if (!checkActiveSession) {
        await initiatePaymentSession(
          cart,
          selectedGatewayOption
            ? {
                provider_id: selectedGatewayOption.gateway.provider_id,
                data: {
                  gateway_id: selectedGatewayOption.gateway.id,
                  // The gateway's page then opens straight on this method.
                  ...(selectedGatewayOption.method
                    ? { selected_method: selectedGatewayOption.method }
                    : {}),
                  return_url: gatewayReturnUrl(cart.id, countryCode),
                  country_code: countryCode,
                },
              }
            : { provider_id: selectedPaymentMethod }
        )
      }

      if (!shouldInputPaymentDetails) {
        return router.push(
          pathname + "?" + createQueryString("step", "review"),
          {
            scroll: false,
          }
        )
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setError(null)
  }, [isOpen])

  const hasOptions = gatewayOptions.length > 0 || otherMethods.length > 0

  const renderGatewayOption = (option: GatewayOption) => (
    <GatewayPaymentContainer
      key={option.value}
      value={option.value}
      title={option.title}
      description={option.description}
      group={option.group}
      sandbox={option.gateway.environment === "sandbox"}
      selectedPaymentOptionId={selectedPaymentMethod}
    />
  )

  return (
    <div className="">
      <div className="flex flex-row items-center justify-between mb-6">
        <Heading
          level="h2"
          className={clx(
            "flex flex-row text-3xl-regular gap-x-2 items-baseline",
            {
              "opacity-50 pointer-events-none select-none":
                !isOpen && !paymentReady,
            }
          )}
        >
          Pembayaran
          {!isOpen && paymentReady && <CheckCircleSolid />}
        </Heading>
        {!isOpen && paymentReady && (
          <Text>
            <button
              onClick={handleEdit}
              className="text-ui-fg-interactive hover:text-ui-fg-interactive-hover"
              data-testid="edit-payment-button"
            >
              Ubah
            </button>
          </Text>
        )}
      </div>
      <div>
        <div className={isOpen ? "block" : "hidden"}>
          {gatewayFailed && (
            <div
              className="mb-4 rounded-rounded border border-red-200 bg-red-50 px-4 py-3 text-small-regular text-red-700"
              data-testid="payment-failed-notice"
            >
              Pembayaran belum berhasil, dibatalkan, atau sudah kedaluwarsa.
              Silakan coba lagi atau pilih metode pembayaran lain.
            </div>
          )}

          {!paidByGiftcard && hasOptions && (
            <>
              <RadioGroup
                value={selectedPaymentMethod}
                onChange={(value: string) => setPaymentMethod(value)}
              >
                {methodGroups.map((group) => (
                  <div
                    key={group.id}
                    className="mb-4"
                    data-testid="payment-method-group"
                  >
                    <Text className="txt-medium-plus text-ui-fg-base mb-2">
                      {group.title}
                    </Text>
                    {group.options.map(renderGatewayOption)}
                  </div>
                ))}
                {methodGroups.length > 0 &&
                  (ungroupedOptions.length > 0 || otherMethods.length > 0) && (
                    <Text className="txt-medium-plus text-ui-fg-base mb-2">
                      Lainnya
                    </Text>
                  )}
                {ungroupedOptions.map(renderGatewayOption)}
                {otherMethods.map((paymentMethod) => (
                  <div key={paymentMethod.id}>
                    {isStripeLike(paymentMethod.id) ? (
                      <StripePaymentContainer
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                        paymentInfoMap={paymentInfoMap}
                        setError={setError}
                        setPaymentComplete={setPaymentComplete}
                      />
                    ) : (
                      <PaymentContainer
                        paymentInfoMap={paymentInfoMap}
                        paymentProviderId={paymentMethod.id}
                        selectedPaymentOptionId={selectedPaymentMethod}
                      />
                    )}
                  </div>
                ))}
              </RadioGroup>
            </>
          )}

          {paidByGiftcard && (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Metode pembayaran
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Kartu hadiah
              </Text>
            </div>
          )}

          <ErrorMessage
            error={error}
            data-testid="payment-method-error-message"
          />

          <Button
            size="large"
            className="mt-6"
            onClick={handleSubmit}
            isLoading={isLoading}
            disabled={
              (isStripeLike(selectedPaymentMethod) && !paymentComplete) ||
              (!selectedPaymentMethod && !paidByGiftcard)
            }
            data-testid="submit-payment-button"
          >
            {!activeSession && isStripeLike(selectedPaymentMethod)
              ? "Masukkan detail pembayaran"
              : "Lanjut ke Tinjauan Pesanan"}
          </Button>
        </div>

        <div className={isOpen ? "hidden" : "block"}>
          {cart && paymentReady && activeSession ? (
            <div className="flex items-start gap-x-1 w-full">
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Metode pembayaran
                </Text>
                <Text
                  className="txt-medium text-ui-fg-subtle"
                  data-testid="payment-method-summary"
                >
                  {activeGatewayOption?.title ||
                    activeGateway?.name ||
                    paymentInfoMap[activeSession?.provider_id]?.title ||
                    activeSession?.provider_id}
                </Text>
              </div>
              <div className="flex flex-col w-1/3">
                <Text className="txt-medium-plus text-ui-fg-base mb-1">
                  Detail pembayaran
                </Text>
                <div
                  className="flex gap-2 txt-medium text-ui-fg-subtle items-center"
                  data-testid="payment-details-summary"
                >
                  <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                    {activeGateway ? (
                      <GatewayMethodIcon group={activeGatewayOption?.group ?? null} />
                    ) : (
                      paymentInfoMap[activeSession.provider_id]?.icon || <CreditCard />
                    )}
                  </Container>
                  <Text>
                    {activeGateway
                      ? "Bayar di halaman pembayaran berikutnya"
                      : "Langkah selanjutnya akan muncul"}
                  </Text>
                </div>
              </div>
            </div>
          ) : paidByGiftcard ? (
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Metode pembayaran
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method-summary"
              >
                Kartu hadiah
              </Text>
            </div>
          ) : null}
        </div>
      </div>
      <Divider className="mt-8" />
    </div>
  )
}

export default Payment
