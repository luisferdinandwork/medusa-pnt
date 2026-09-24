# AGENTS.md (apps/storefront-b2b)

SPECS B2B: a small wholesale storefront for resellers. UI text is Bahasa Indonesia, and **every page except `/masuk` and `/daftar` requires a customer login**. It is separate from `apps/storefront` (the consumer stores) and shares only the visual identity (ink / paper / red, Archivo Black + Inter).

Read the root [AGENTS.md](../../AGENTS.md) first; this file only covers what differs here.

## Commands

```bash
npm run storefront-b2b:dev              # from repo root -> http://localhost:8002
cd apps/storefront-b2b && npm run lint  # tsc --noEmit (no ESLint config in this app)
cd apps/backend && npm run seed:b2b     # one-off, idempotent: creates the "SPECS B2B" sales channel + publishable key, links all products
```

`seed:b2b` prints the publishable key; put it in `apps/storefront-b2b/.env.local` (see `.env.template`). Re-run it after adding products so they appear in the B2B channel.

## Structure

- `src/middleware.ts` - first login gate (checks the `_b2b_jwt` cookie exists, redirects to `/masuk?next=...`).
- `src/app/(auth)/` - `/masuk`, `/daftar` (public).
- `src/app/(toko)/` - catalog `/`, `/produk/[handle]`, `/keranjang`, `/checkout`, `/pesanan`, `/pesanan/[id]` (also the order-confirmed page, with `?baru=1`), `/akun`. Its `layout.tsx` calls `requireCustomer()`, which validates the session against the backend.
- `src/lib/actions/` - `"use server"` files (login, register, cart, promo codes, checkout steps, `placeOrder`). `src/lib/data/` - server-only readers. Keep them separate: a `"use server"` file may only export async functions.
- `src/lib/store-config.ts` - branding/announcement copy from `GET /store/storefront` (edited in the admin under Storefronts).

## Cart to checkout (parity with `apps/storefront`)

Cart: quantity edit, remove, promo codes (apply/remove, validated), totals with discount/tax, free-shipping progress (read from the shipping option's `item_total` price rule), nav mini-cart.
Checkout is four steps driven by `?step=alamat|pengiriman|pembayaran|tinjau` (`src/lib/checkout.ts`): address (email, saved-address picker, separate billing address, optional "save address"), shipping (flat, calculated and pickup options), payment (region providers; only `pp_system_default` is supported), review + `placeOrder`. A step can only be opened once the earlier ones are done (`resolveStep`). Each step is a server action that redirects to the next.
Not ported: Stripe/card and redirect-based payment providers, and order transfer.

## Conventions and gotchas

- Route names are Indonesian on purpose (`/keranjang`, `/pesanan`); keep new routes and copy in Bahasa Indonesia.
- Cookies are named `_b2b_jwt` / `_b2b_cart_id`, not `_medusa_*`. Cookies are not port-scoped on localhost, so reusing the consumer storefront's names would let a B2C session pass the B2B gate.
- The SDK uses `jwtTokenStorageMethod: "nostore"` and each call passes the auth header from the cookie explicitly. Do not let the SDK keep a token in the shared server instance.
- Checkout uses the region's default payment provider (`pp_system_default`, manual): the buyer is invoiced and pays by bank transfer. Card/Stripe is deliberately not wired up.
- Known repo-level issue, not specific to this app: `next build` fails while prerendering `/404` for both storefronts (React error #31 / `useContext` of null). The root `node_modules` hoists React 18 (the backend admin needs it) and Next's Pages-Router pieces (`next`, `styled-jsx`) pick it up instead of the storefronts' React 19. `next dev` is unaffected and is what this app has been verified with. A production build needs the React versions isolated (e.g. separate install for the storefronts).
- Login gating is UI-level: the publishable key is public, so someone holding it can still call `/store/products` directly. Hard gating needs a backend middleware (`src/api/middlewares.ts`) requiring customer auth for the B2B channel.
