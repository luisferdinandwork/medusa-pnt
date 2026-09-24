import { Metadata } from "next"

import { getStoreConfig } from "@lib/data/store-config"
import LoginTemplate from "@modules/account/templates/login-template"

export async function generateMetadata(): Promise<Metadata> {
  const storeConfig = await getStoreConfig()

  return {
    title: "Masuk",
    description: `Masuk ke akun ${storeConfig.name} kamu.`,
  }
}

export default async function Login() {
  const storeConfig = await getStoreConfig()

  return <LoginTemplate storeShortName={storeConfig.shortName} />
}
