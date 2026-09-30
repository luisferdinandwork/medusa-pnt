import { getCartId, setCartId } from "@lib/data/cookies"
import { settleGatewayPayment } from "@lib/data/payment-gateway"
import { NextRequest, NextResponse } from "next/server"

// Midtrans / DOKU send the shopper back here after the payment page, whatever
// the outcome. The query only says which cart it was; the real status comes
// from the backend asking the gateway. Also works as the fallback Finish /
// Unfinish / Error URL in the Midtrans dashboard: without a cart_id the cart
// comes from the cookie.
export async function GET(req: NextRequest) {
  const { origin, searchParams } = req.nextUrl
  const cookieCartId = await getCartId()
  const cartId = searchParams.get("cart_id") || cookieCartId
  const countryCode = searchParams.get("country_code")

  const outcome = await settleGatewayPayment(cartId, countryCode)

  // The waiting page and the payment step read the cart from the cookie. Only
  // adopt the cart when this browser has none (e.g. the payment page opened in
  // another browser), never replace the shopper's own cart.
  if (outcome.status !== "paid" && cartId && !cookieCartId) {
    await setCartId(cartId)
  }

  const target = outcome.redirectTo.startsWith("/")
    ? `${origin}${outcome.redirectTo}`
    : outcome.redirectTo

  return NextResponse.redirect(target)
}
