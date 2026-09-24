import { NextRequest, NextResponse } from "next/server"

// Whole store is login-only: without a session cookie every page except the
// login/register pages redirects to /masuk. Pages re-validate the session
// against the backend (see requireCustomer); this is the fast first gate.
const PUBLIC_PATHS = ["/masuk", "/daftar"]

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const hasSession = request.cookies.has("_b2b_jwt")
  const isPublic = PUBLIC_PATHS.includes(pathname)

  if (!hasSession && !isPublic) {
    const url = new URL("/masuk", request.url)
    if (pathname !== "/") url.searchParams.set("next", pathname + search)
    return NextResponse.redirect(url)
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\..*).*)"],
}
