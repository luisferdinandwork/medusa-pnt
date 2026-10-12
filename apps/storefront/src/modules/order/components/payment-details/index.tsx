import { Container, Heading, Text } from "@modules/common/components/ui"

import { isGatewayProvider, isStripeLike, paymentInfoMap } from "@lib/constants"
import { gatewayMethodLabel } from "@lib/util/gateway-methods"
import { CreditCard } from "@medusajs/icons"
import Divider from "@modules/common/components/divider"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"

type PaymentDetailsProps = {
  order: HttpTypes.StoreOrder
}

const PaymentDetails = ({ order }: PaymentDetailsProps) => {
  const payment = order.payment_collections?.[0].payments?.[0]
  const info = payment ? paymentInfoMap[payment.provider_id] : undefined
  // Midtrans / DOKU payments carry the gateway's name and the method used
  // (or, failing that, the one picked at checkout).
  const gatewayData = isGatewayProvider(payment?.provider_id)
    ? (payment?.data as
        | { gateway_name?: string; payment_method?: string; selected_method?: string }
        | undefined)
    : undefined
  const gatewayMethod = gatewayData?.payment_method || gatewayData?.selected_method

  return (
    <div>
      <Heading level="h2" className="flex flex-row text-3xl-regular my-6">
        Pembayaran
      </Heading>
      <div>
        {payment && (
          <div className="flex items-start gap-x-1 w-full">
            <div className="flex flex-col w-1/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Metode pembayaran
              </Text>
              <Text
                className="txt-medium text-ui-fg-subtle"
                data-testid="payment-method"
              >
                {(gatewayMethod && gatewayMethodLabel(gatewayMethod)) ||
                  gatewayData?.gateway_name ||
                  info?.title ||
                  payment.provider_id}
              </Text>
            </div>
            <div className="flex flex-col w-2/3">
              <Text className="txt-medium-plus text-ui-fg-base mb-1">
                Detail pembayaran
              </Text>
              <div className="flex gap-2 txt-medium text-ui-fg-subtle items-center">
                <Container className="flex items-center h-7 w-fit p-2 bg-ui-button-neutral-hover">
                  {info?.icon ?? <CreditCard />}
                </Container>
                <Text data-testid="payment-amount">
                  {isStripeLike(payment.provider_id) && payment.data?.card_last4
                    ? `**** **** **** ${payment.data.card_last4}`
                    : `${convertToLocale({
                        amount: payment.amount,
                        currency_code: order.currency_code,
                      })} dibayar pada ${new Date(
                        payment.created_at ?? ""
                      ).toLocaleString()}`}
                </Text>
              </div>
            </div>
          </div>
        )}
      </div>

      <Divider className="mt-8" />
    </div>
  )
}

export default PaymentDetails
