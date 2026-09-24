import React from "react"

import UnderlineLink from "@modules/common/components/interactive-link"
import { clx } from "@modules/common/components/ui"

import AccountNav from "../components/account-nav"
import { HttpTypes } from "@medusajs/types"

interface AccountLayoutProps {
  customer: HttpTypes.StoreCustomer | null
  children: React.ReactNode
}

const AccountLayout: React.FC<AccountLayoutProps> = ({
  customer,
  children,
}) => {
  return (
    <div className="flex-1 py-8 small:py-16 bg-paper" data-testid="account-page">
      <div className="flex-1 content-container max-w-5xl mx-auto flex flex-col">
        <div
          className={
            customer
              ? "grid grid-cols-1 small:grid-cols-[240px_1fr] gap-y-8 small:gap-x-12"
              : "flex justify-center"
          }
        >
          {customer && <AccountNav customer={customer} />}
          <div
            className={clx(
              "flex-1 min-w-0 rounded-large bg-white border border-paper-200 p-6 small:p-10",
              { "max-w-md": !customer }
            )}
          >
            {children}
          </div>
        </div>
        <div className="flex flex-col small:flex-row items-start small:items-end justify-between gap-6 mt-12 pt-10 border-t border-paper-200">
          <div>
            <h3 className="font-display uppercase text-xl mb-2">
              Ada pertanyaan?
            </h3>
            <span className="txt-medium text-ink-500">
              Temukan pertanyaan dan jawaban seputar belanja di halaman layanan
              pelanggan kami.
            </span>
          </div>
          <div>
            <UnderlineLink href="/customer-service">
              Layanan Pelanggan
            </UnderlineLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AccountLayout
