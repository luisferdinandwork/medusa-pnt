import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: "./src/modules/storefront",
    },
    {
      resolve: "./src/modules/content",
    },
    {
      resolve: "./src/modules/banner",
    },
    {
      resolve: "./src/modules/payment-gateway",
    },
    {
      resolve: "@medusajs/medusa/payment",
      // The Midtrans and DOKU providers read their keys and settings from the
      // payment_gateway module (edited in the admin under Storefronts >
      // Payments), so the payment module needs it in its container.
      dependencies: ["payment_gateway"],
      options: {
        providers: [
          { resolve: "./src/modules/midtrans-payment", id: "midtrans" },
          { resolve: "./src/modules/doku-payment", id: "doku" },
        ],
      },
    },
  ],
})
