import "server-only"
import { cookies as nextCookies } from "next/headers"

// Cookie names are prefixed with "_b2b" because cookies are not port-scoped on
// localhost: the consumer storefront (port 8000) uses "_medusa_jwt" and must not
// be mistaken for a B2B session.
export const AUTH_COOKIE = "_b2b_jwt"
const CART_COOKIE = "_b2b_cart_id"
const WEEK = 60 * 60 * 24 * 7

const base = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
}

export async function getAuthHeaders(): Promise<{ authorization: string } | {}> {
  const token = (await nextCookies()).get(AUTH_COOKIE)?.value
  return token ? { authorization: `Bearer ${token}` } : {}
}

export async function setAuthToken(token: string) {
  ;(await nextCookies()).set(AUTH_COOKIE, token, { ...base, maxAge: WEEK })
}

export async function removeAuthToken() {
  ;(await nextCookies()).set(AUTH_COOKIE, "", { ...base, maxAge: -1 })
}

export async function getCartId() {
  return (await nextCookies()).get(CART_COOKIE)?.value
}

export async function setCartId(id: string) {
  ;(await nextCookies()).set(CART_COOKIE, id, { ...base, maxAge: WEEK })
}

export async function removeCartId() {
  ;(await nextCookies()).set(CART_COOKIE, "", { ...base, maxAge: -1 })
}
