import Medusa from "@medusajs/js-sdk"

// "nostore": the token is passed explicitly on each request from the httpOnly
// cookie, never kept in the (shared, server-wide) SDK instance.
export const sdk = new Medusa({
  baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
  debug: process.env.NODE_ENV === "development",
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY,
  auth: { type: "jwt", jwtTokenStorageMethod: "nostore" },
})
