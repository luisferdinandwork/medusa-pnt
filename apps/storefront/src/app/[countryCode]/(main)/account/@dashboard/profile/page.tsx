import { Metadata } from "next"

import ProfilePhone from "@modules/account//components/profile-phone"
import ProfileBillingAddress from "@modules/account/components/profile-billing-address"
import ProfileEmail from "@modules/account/components/profile-email"
import ProfileName from "@modules/account/components/profile-name"
import { notFound } from "next/navigation"
import { listRegions } from "@lib/data/regions"
import { retrieveCustomer } from "@lib/data/customer"
import { getStoreConfig } from "@lib/data/store-config"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: "Profil",
    description: `Lihat dan ubah profil ${storeConfig.name} kamu.`,
  }
}

export default async function Profile() {
  const customer = await retrieveCustomer()
  const regions = await listRegions()

  if (!customer || !regions) {
    notFound()
  }

  return (
    <div className="w-full" data-testid="profile-page-wrapper">
      <div className="mb-8 flex flex-col gap-y-2">
        <h1 className="font-display uppercase text-2xl">Profil</h1>
        <p className="text-base-regular text-ink-500">
          Lihat dan ubah data profil kamu, termasuk nama, email, dan nomor
          telepon. Kamu juga bisa memperbarui alamat penagihan.
        </p>
      </div>
      <div className="flex flex-col gap-y-8 w-full">
        <ProfileName customer={customer} />
        <Divider />
        <ProfileEmail customer={customer} />
        <Divider />
        <ProfilePhone customer={customer} />
        <Divider />
        {/* <ProfilePassword customer={customer} />
        <Divider /> */}
        <ProfileBillingAddress customer={customer} regions={regions} />
      </div>
    </div>
  )
}

const Divider = () => {
  return <div className="w-full h-px bg-paper-200" />
}
