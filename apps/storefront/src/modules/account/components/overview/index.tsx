import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { convertToLocale } from "@lib/util/money"
import { HttpTypes } from "@medusajs/types"
import ChevronDown from "@modules/common/icons/chevron-down"

type OverviewProps = {
  customer: HttpTypes.StoreCustomer | null
  orders: HttpTypes.StoreOrder[] | null
}

const Overview = ({ customer, orders }: OverviewProps) => {
  return (
    <div data-testid="overview-page-wrapper">
      <div className="flex flex-col small:flex-row small:items-center justify-between gap-2 mb-8">
        <span
          className="font-display uppercase text-2xl"
          data-testid="welcome-message"
          data-value={customer?.first_name}
        >
          Halo, {customer?.first_name}
        </span>
        <span className="text-small-regular text-ink-500">
          Masuk sebagai{" "}
          <span
            className="font-semibold text-ink"
            data-testid="customer-email"
            data-value={customer?.email}
          >
            {customer?.email}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-10">
        <div className="rounded-large border border-paper-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">
            Profil
          </h3>
          <div className="flex items-end gap-x-2">
            <span
              className="font-display text-4xl leading-none"
              data-testid="customer-profile-completion"
              data-value={getProfileCompletion(customer)}
            >
              {getProfileCompletion(customer)}%
            </span>
            <span className="uppercase text-xs text-ink-500 mb-1">
              Lengkap
            </span>
          </div>
        </div>

        <div className="rounded-large border border-paper-200 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500 mb-3">
            Alamat
          </h3>
          <div className="flex items-end gap-x-2">
            <span
              className="font-display text-4xl leading-none"
              data-testid="addresses-count"
              data-value={customer?.addresses?.length || 0}
            >
              {customer?.addresses?.length || 0}
            </span>
            <span className="uppercase text-xs text-ink-500 mb-1">
              Tersimpan
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-500">
          Pesanan terbaru
        </h3>
        <ul className="flex flex-col gap-y-3" data-testid="orders-wrapper">
          {orders && orders.length > 0 ? (
            orders.slice(0, 5).map((order) => {
              return (
                <li key={order.id} data-testid="order-wrapper" data-value={order.id}>
                  <LocalizedClientLink
                    href={`/account/orders/details/${order.id}`}
                    className="group flex items-center justify-between gap-4 rounded-large border border-paper-200 hover:border-ink transition-colors p-4"
                  >
                    <div className="grid grid-cols-1 xsmall:grid-cols-3 text-small-regular gap-x-4 gap-y-2 flex-1 min-w-0">
                      <div className="flex flex-col gap-y-0.5">
                        <span className="text-xs uppercase tracking-wide text-ink-500">
                          Tanggal
                        </span>
                        <span data-testid="order-created-date">
                          {new Date(order.created_at).toLocaleDateString("id-ID")}
                        </span>
                      </div>
                      <div className="flex flex-col gap-y-0.5">
                        <span className="text-xs uppercase tracking-wide text-ink-500">
                          No. pesanan
                        </span>
                        <span data-testid="order-id" data-value={order.display_id}>
                          #{order.display_id}
                        </span>
                      </div>
                      <div className="flex flex-col gap-y-0.5">
                        <span className="text-xs uppercase tracking-wide text-ink-500">
                          Total
                        </span>
                        <span className="font-semibold" data-testid="order-amount">
                          {convertToLocale({
                            amount: order.total,
                            currency_code: order.currency_code,
                          })}
                        </span>
                      </div>
                    </div>
                    <button
                      className="shrink-0 text-ink-500 group-hover:text-red-500 transition-colors"
                      data-testid="open-order-button"
                    >
                      <span className="sr-only">
                        Lihat pesanan #{order.display_id}
                      </span>
                      <ChevronDown className="-rotate-90" />
                    </button>
                  </LocalizedClientLink>
                </li>
              )
            })
          ) : (
            <span
              className="text-ink-500 text-small-regular"
              data-testid="no-orders-message"
            >
              Belum ada pesanan
            </span>
          )}
        </ul>
      </div>
    </div>
  )
}

const getProfileCompletion = (customer: HttpTypes.StoreCustomer | null) => {
  let count = 0

  if (!customer) {
    return 0
  }

  if (customer.email) {
    count++
  }

  if (customer.first_name && customer.last_name) {
    count++
  }

  if (customer.phone) {
    count++
  }

  const billingAddress = customer.addresses?.find(
    (addr) => addr.is_default_billing
  )

  if (billingAddress) {
    count++
  }

  return (count / 4) * 100
}

export default Overview
