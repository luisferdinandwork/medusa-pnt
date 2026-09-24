import "server-only"
import { HttpTypes } from "@medusajs/types"
import { redirect } from "next/navigation"
import { sdk } from "@/lib/sdk"
import { getAuthHeaders } from "@/lib/cookies"

export async function getCustomer(): Promise<HttpTypes.StoreCustomer | null> {
  const headers = await getAuthHeaders()
  if (!("authorization" in headers)) return null
  return sdk.store.customer
    .retrieve({ fields: "*addresses" }, headers)
    .then(({ customer }) => customer)
    .catch(() => null)
}

// Pages call this: a missing or expired session sends the visitor to the login page.
export async function requireCustomer() {
  const customer = await getCustomer()
  if (!customer) redirect("/masuk")
  return customer
}
