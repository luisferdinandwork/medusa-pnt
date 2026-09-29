# AGENTS.md

## Overview

Medusa DTC Starter — a Turborepo workspace monorepo containing a Medusa backend (`@medusajs/medusa` latest, Node 20+, PostgreSQL 15+) and an optional storefront (Next.js, Tanstack, etc...).

## Directory Structure

```text
.
├── apps/
│   ├── backend/                  # Medusa application (@dtc/backend)
│   │   ├── medusa-config.ts      # Medusa config: DB URL, CORS, secrets, modules
│   │   ├── integration-tests/    # setup.js (Jest setupFiles) and http/*.spec.ts suites
│   │   ├── seed-assets/          # images the seed scripts upload through the File Module (banners/)
│   │   └── src/
│   │       ├── admin/            # Admin dashboard extensions (widgets/, i18n/, routes)
│   │       ├── api/              # API routes: api/store/*, api/admin/* (file-based)
│   │       ├── jobs/             # Scheduled jobs
│   │       ├── links/            # Module links between modules
│   │       ├── migration-scripts/# Data migration scripts (e.g. initial-data-seed.ts)
│   │       ├── modules/          # Custom modules (service + models + migrations)
│   │       ├── subscribers/      # Event subscribers
│   │       └── workflows/        # Workflows and workflow steps
│   ├── storefront/               # OPTIONAL storefront (SPECS Teamsport / SPECS Run, chosen by NEXT_PUBLIC_STORE_KEY)
│   └── storefront-b2b/           # OPTIONAL SPECS B2B storefront: Bahasa Indonesia, login required (see its AGENTS.md)
├── eslint.config.ts              # Root ESLint: @medusajs/eslint-plugin recommended
├── turbo.json                    # Task graph: build, dev, start, lint, test, seed
```

**`apps/storefront` is optional and may not exist.** It is skipped when the user chooses not to install it. Before running any storefront command, referencing storefront files, or assuming a full-stack change is possible, check that `apps/storefront/` exists. If it doesn't, the project is backend-only — do not scaffold it or suggest it was deleted by mistake.

Each app can have its own nested `AGENTS.md`; agents read the nearest one in the directory tree, so put app-specific context there rather than expanding this file.

## Package Manager

**The package manager is chosen at install time and is not fixed.** Detect it before running anything, in this order:

1. The `packageManager` field in the root `package.json` (e.g. `"pnpm@10.11.1"`) — authoritative when present.
2. The lockfile at the repo root: `pnpm-lock.yaml` → pnpm, `yarn.lock` → yarn, `package-lock.json` → npm.

```bash
node -p "require('./package.json').packageManager ?? 'unset'"
ls pnpm-lock.yaml yarn.lock package-lock.json bun.lock bun.lockb 2>/dev/null
```

Use that manager for every command and never introduce a second lockfile. Below, `<pm>` means the detected manager. The `<pm> run <script>` and `<pm> exec <bin>` forms work across npm, pnpm, yarn, and bun; workspace-filter flags do not, so the per-app commands below `cd` into the app instead.

## Commands

Run from the repo root unless noted. Turbo skips missing apps automatically.

### Development

```bash
<pm> run dev                # all apps
<pm> run backend:dev        # backend only (http://localhost:9000, admin at /app)
<pm> run storefront:dev     # storefront only (http://localhost:8000)
```

### Build

```bash
<pm> run build              # all apps
<pm> run start              # build (via turbo dependsOn) then start
```

### Lint

```bash
<pm> run lint                          # all apps via turbo
cd apps/backend && <pm> run lint       # medusa lint
cd apps/storefront && <pm> run lint    # next lint
```

### Test (backend only; the storefront has no test suite)

```bash
<pm> run test                                              # all test tasks via turbo
cd apps/backend && <pm> run test:unit                      # **/src/**/__tests__/**/*.unit.spec.ts
cd apps/backend && <pm> run test:integration:modules       # **/src/modules/*/__tests__/**
cd apps/backend && <pm> run test:integration:http          # **/integration-tests/http/*.spec.ts
```

Single test — pass a path/pattern through to Jest, keeping `TEST_TYPE`:

```bash
cd apps/backend && <pm> run test:unit -- src/modules/foo/__tests__/service.unit.spec.ts
cd apps/backend && <pm> run test:unit -- -t "returns the cart"
```

### Database

```bash
cd apps/backend
<pm> exec medusa db:generate <module-name>   # generate migrations for a custom module
<pm> exec medusa db:migrate                  # run migrations
<pm> exec medusa user -e admin@test.com -p supersecret
<pm> run backend:seed                        # from root; seeds initial data
<pm> run seed:b2b                            # in apps/backend; adds the SPECS B2B sales channel + publishable key (idempotent, prints the key)
<pm> run seed:storefronts                    # in apps/backend; creates the Storefront records for the 3 stores (idempotent)
<pm> run seed:content                        # in apps/backend; demo blog articles + product stories (idempotent)
<pm> run seed:content:refresh                # in apps/backend; overwrites the demo records with the seed's copy and images
<pm> run seed:omnichannel                    # in apps/backend; the DM / FF001 / FS001 stock locations + dummy store stock (idempotent; `-- reset` re-applies the store stock)
<pm> run seed:catalog                        # in apps/backend; Footwear / Apparel / Accessories / Equipment tree, 38 specs.id products with galleries, galleries for the initial seed's products (idempotent)
<pm> run seed:banners                        # in apps/backend; homepage banners for specs-teamsport / specs-run + the story photo (skips storefronts that have banners)
<pm> run seed:banners:refresh                # in apps/backend; replaces those storefronts' banners with the seed's (admin edits are lost)
```

## Storefronts (multi-store)

One Medusa backend serves several storefronts. Each storefront is a **sales channel + publishable API key + `Storefront` record**:

- Products, orders, stock and customers are managed per sales channel in the normal Medusa admin pages.
- Branding and homepage copy (name, tagline, announcement bar, hero) live in the `storefront` custom module (`apps/backend/src/modules/storefront`), linked to the sales channel, and are edited in the admin under **Storefronts** (`src/admin/routes/storefronts`, with the homepage sections under **Storefronts > Homepage**). Admin API: `/admin/storefronts`; workflows: `create-storefront`, `update-storefront`.
- A storefront reads its own record from `GET /store/storefront`, resolved from the publishable key it already sends (cached ~60 s). The static presets in `apps/storefront/src/lib/store-config.ts` and the fallback in `apps/storefront-b2b/src/lib/store-config.ts` are used only if the record is missing or the backend is down. Never hardcode store copy in components; add a field to the module instead (new migration, do not edit an existing one).
- `apps/storefront` = SPECS Teamsport / SPECS Run (one codebase, chosen by `NEXT_PUBLIC_STORE_KEY` + its publishable key). `apps/storefront-b2b` = SPECS B2B, login required (see its `AGENTS.md`).

## Content (blog & product stories)

Editorial content lives in the `content` custom module (`apps/backend/src/modules/content`) and is edited in the admin under **Content > Articles** and **Content > Product Stories** (`src/admin/routes/content`).

- Admin sidebar: custom pages are grouped by folder nesting, not listed flat. `routes/storefronts` and `routes/content` are the group parents (`label`, `icon`, `rank`); a page one folder below with a `label` becomes a sub-item. Keep new custom pages inside one of these groups, or under a core section with `nested` (e.g. `routes/pricing` uses `nested: "/products"`).
- Images (article cover/share image, story cover, story section images) are uploaded through the File Module (`sdk.admin.upload.create`, `src/admin/components/content/image-upload.tsx`); only the returned URL is stored.

- `Article` = a blog post. Besides the body it carries the SEO fields a crawler reads (`seo_*`, `canonical_url`, `noindex`) and the GEO fields an answer engine quotes (`answer_summary`, `key_takeaways`, `faqs`, `sources`, `geo_locale`, `geo_target_area`). The storefront renders both the page and its JSON-LD from one record.
- `ProductStory` = one story per product (e.g. "Sepatu Bola FG", named in `product_name`), which can cover several models. `product_handles` decides which product pages show it, so a story is the page that ties those models together. Each entry in `sections` may carry an `image_url` / `image_alt`.
- Both have `storefront_key`: a storefront key scopes the record to one shop front, `null` shows it on all of them. Store routes resolve the key from the publishable API key (`src/api/utils/storefront-scope.ts`) and only ever return `status = "published"`.
- Admin API: `/admin/articles`, `/admin/product-stories` (GET list with `q`/`status`/`storefront_key`/`limit`/`offset`, POST create, and `:id` GET/POST/DELETE). Store API: `/store/articles`, `/store/articles/:handle`, `/store/product-stories`, `/store/product-stories/:handle`.
- Workflows: `create|update|delete-article`, `create|update|delete-product-story`. Deletes are soft deletes so the compensation can restore them.
- Storefront pages: `/blog` (labelled "Articles"), `/blog/[handle]`, `/stories` (labelled "Product Stories"), `/stories/[handle]`, plus the story teaser on product pages and the four latest articles on the homepage (`modules/home/components/latest-articles`). They are linked from the Menu overlay and the footer "Editorial" column, not from the header bar. Article and story bodies are Markdown, rendered by `src/lib/util/markdown.tsx` into React elements (never raw HTML). Structured data is built in `src/lib/util/json-ld.ts`.
- `related_product_handles` / `product_handles` reference products **by handle**, not id, so content survives a reseed. A handle that no longer exists is skipped silently.

## Omnichannel (ship-from location)

The shopper picks the stock location each item ships from: the warehouse **DM** (Daan Mogot Storage, the default) or a store (**FF001** Fisik Football, **FS001** Factory Outlet), all at Specs Arena, Jl. Daan Mogot.

- A location takes part when its `metadata.omnichannel` is `true`; `location_code`, `location_kind` (`warehouse`/`store`), `omnichannel_default`, `latitude`, `longitude` live next to it. They are edited in the admin on the location page (widget `src/admin/widgets/location-omnichannel.tsx`). Shared helpers: `apps/backend/src/lib/omnichannel.ts`.
- DM is the initial seed's former "Gudang Jakarta", so it keeps the shop's shipping options (Reguler, Instan). Store locations have no shipping options of their own; staff pick the location when creating the fulfilment.
- Store API: `GET /store/omnichannel/availability?variant_id=a,b` returns the channel's locations and the units left per variant and location.
- The choice travels on the line item: `metadata.stock_location_id` / `stock_location_code` / `stock_location_name`, from cart to order. Lines only merge when their metadata matches, so the same size from two locations is two lines. Lines without the key count as the default location.
- `src/workflows/hooks/omnichannel-cart.ts` checks the chosen location's stock on add-to-cart and line updates (Medusa itself only checks all locations together). The `order.placed` subscriber runs `apply-order-stock-locations`, which moves each reservation to the chosen location (Medusa reserves at the first location with stock) and keeps it where it is when the chosen location ran out. The order page shows it in the "Ship from" widget.
- Storefront: the product page asks for the shopper's position (`src/lib/hooks/use-shopper-location.ts`), preselects DM when it has the size, falls back to the nearest location with stock, and suggests a closer one (`src/lib/util/omnichannel.ts`). The cart shows and changes each line's location (`changeLineItemLocation` in `src/lib/data/cart.ts`).
- **Pickup (ambil di toko):** a bag is either delivered or collected at one store, because a cart has a single shipping method. Lines carry `metadata.fulfillment_type` (`delivery`/`pickup`); `addToCart` and `setCartFulfillment` move the whole bag when the mode or store changes, and refuse with the products a store can't cover. Each store has a pickup fulfillment set with a free "Ambil di <store>" shipping option (created by `seed:omnichannel`, which reuses a pickup set enabled from the admin). The checkout only offers the bag's own options, and `completeCartWorkflow.hooks.validate` rejects a shipping method that doesn't match the bag.

## Catalog & navigation

- Categories are a two-level tree: four main categories (**Footwear**, **Apparel**, **Accessories**, **Equipment**, ordered by `rank`) with subcategories (Footwear: `sepatu-bola`, `sepatu-futsal`, `sepatu-running`; Apparel: `jersey`, `kaos-tank`, `celana`, `jaket`; Accessories: `kaos-kaki`, `tas`, `topi-headwear`; Equipment: `bola`, `sarung-tangan-kiper`, `pelindung`, `perlengkapan-latihan`). Products are assigned to the subcategory; a parent category page, its count and its filters cover the whole branch (`categoryBranchIds` in `apps/storefront/src/lib/util/category-tree.ts`; the B2B storefront does the same in `lib/data/catalog.ts`).
- A category's menu photo is `metadata.image_url`, falling back to the first product thumbnail.
- `seed:catalog` (`src/scripts/seed-catalog.ts`, data in `src/scripts/data/specs-catalog.ts`) builds that tree, ranks the shared size options (`Ukuran`, `Ukuran Baju`, `Ukuran Kaos Kaki`, `Ukuran Bola`, `Ukuran Sarung Tangan`, `Ukuran Aksesoris`; values ranked S, M, L, XL / 39, 40...), creates the specs.id products (photos hotlinked from the specs.id CDN), turns specs.id's current discounts into sale prices, and adds stock through `seed:omnichannel`. Size pickers and filters sort values by `rank`.
- Header (`src/modules/layout/templates/nav`): the four main categories open a mega menu (`components/mega-menu`) with the subcategories as links and photo tiles; the Menu overlay (`components/side-menu`) lists the same tree for phones. `components/nav-shell` makes the header transparent with light text while it sits over an element marked `data-nav-overlay` (the homepage slider, which pulls itself up under the header with `-mt-16`), and solid once scrolled past it, on hover, or while a menu is open.
- Product photos from specs.id sit on `#EFEFF1`; the `photo` Tailwind color is used behind product imagery so they blend in.

## Homepage banners

The storefront homepage is image-first: every section below is a set of photos that link into the catalog. Banners live in the `banner` custom module (`apps/backend/src/modules/banner`) and are edited per storefront in the admin under **Storefronts > Banners** (`src/admin/routes/storefronts/banners`), which has a storefront switcher, a desktop + phone preview, reordering, show/hide, scheduling and "Copy from..." another storefront.

- `Banner`: `storefront_key` (required, one set per storefront), `placement` (`hero` slider, `category` tiles, `promo` pair, `feature` wide banner), `image_url` + optional `mobile_image_url` (phones under 768 px), overlay copy (`eyebrow`, `title`, `subtitle`, `cta_label`, `text_align`, `text_theme`), `link_type` (`category` / `collection` / `product` by **handle**, or `url`) + `link_value`, `is_active`, `starts_at` / `ends_at`, `rank`.
- Admin API: `/admin/banners` (GET `?storefront_key=`, POST), `/admin/banners/:id` (GET/POST/DELETE), `POST /admin/banners/reorder` (`{ ids }`), `POST /admin/banners/copy` (`{ from_storefront_key, to_storefront_key, replace }`). Workflows: `create|update|delete-banner`, `reorder-banners`, `copy-storefront-banners`.
- Store API: `GET /store/banners` returns the publishable key's storefront banners that are active and inside their schedule, in homepage order. Read by `listHomepageBanners` (`apps/storefront/src/lib/data/banners.ts`, cached 60 s).
- The hero slider loops endlessly: a copy of the last slide sits before the first and of the first after the last, and the track jumps to the real slide when a scroll settles on a copy.
- Homepage order (`app/[countryCode]/(main)/page.tsx`): hero slider, category tiles, new arrivals, promo pair, feature banner, on-sale products, editorial story (with its photo, `editorial_image_url` on the Storefront record), guide cards, latest articles. With no hero slides the text hero from the Storefront record is shown; with no category tiles, text links to the top categories; empty promo/feature sections are left out.
- Seed images are SPECS campaign banners from specs.id, cropped per section in `apps/backend/seed-assets/banners` and uploaded through the File Module by `seed:banners`.

## Prices & sales

A product's regular price is its variants' plain price in the store's default currency; its sale price sits in a Medusa price list of type `sale` that belongs to that product only (`metadata.managed_by = "product-pricing"`, `metadata.product_id`), so every product can have its own sale period. Both are edited in one place:

- the **Price & sale** card at the top of the product page's side column (`src/admin/widgets/product-pricing.tsx`), and
- **Products > Prices & sales** (`src/admin/routes/pricing`), a list of every product with its regular price, sale price and sale status.
- The editor (`src/admin/components/pricing/pricing-editor.tsx`) sets the regular price per variant or for all, a sale price per variant, by discount % or for all, and optional start / last day. Saving runs `update-product-pricing`, which plans the change (`plan-product-pricing` step) and applies it through Medusa's own workflows (variant prices, create / update / batch / delete price list). The list is created with the first sale price and deleted with the last one. Price lists created by hand under **Price Lists** keep working and are shown in the editor.
- Admin API: `GET /admin/product-pricing` (overview, `q`/`limit`/`offset`), `GET|POST /admin/product-pricing/:id`. Shared read model: `apps/backend/src/lib/product-pricing.ts`. Price-list prices are read with the Pricing Module's `listPrices`, because a price set's `prices` relation only returns its plain prices.
- The storefront shows the regular price struck through and a "-N%" badge whenever the calculated price comes from a sale list (`price_list_type === "sale"`). The initial seed's `product.metadata.compare_at_amount` is an older display-only "was" price; the editor offers to convert it into a real sale.

## Product videos

Medusa's product media section only takes images, so videos are uploaded in the admin's **Videos** card on the product page (`src/admin/widgets/product-videos.tsx`, MP4/WebM/MOV up to 50 MB, through `/admin/uploads`) and stored as `product.metadata.videos` (`[{ url, alt }]`). The storefront gallery shows them after the first image, muted and looping, and with controls in the full-screen viewer. Product data is cached by the storefront for 60 seconds (`lib/data/products.ts`), so admin edits show up within a minute.

## Medusa Skills & MCP Server

These are optional but strongly recommended — they give documentation-backed answers instead of guesses about Medusa APIs. **Use them when available; if they are not, mention to the user that installing them meaningfully improves development on this project.**

**Agentic skills** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/agentic-skills)) — if the `medusa-dev` skills are listed as available, load them *before* writing code, not after:

- `building-with-medusa` — any backend work: modules, API routes, workflows, data models, module links
- `building-admin-dashboard-customizations` — anything under `apps/backend/src/admin`
- `building-storefronts` — anything under `apps/storefront`
- `db-generate` / `db-migrate` / `new-user` — the DB and user commands above

If they are not installed, suggest:

```bash
/plugin marketplace add medusajs/medusa-agent-skills
/plugin install medusa-dev@medusa
```

**MCP server** ([docs](https://docs.medusajs.com/learn/introduction/build-with-llms-ai/mcp-server)) — a `medusa` MCP server exposing the official docs. Prefer it over web search or memory for any Medusa API, config, or upgrade question. If it is not connected, suggest:

```bash
claude mcp add --transport http medusa https://docs.medusajs.com/mcp # or agent equivalent
```

## Code Style

- **The backend must satisfy `@medusajs/eslint-plugin`'s recommended config** (`eslint.config.ts`). Its rules encode Medusa framework requirements — correct route/workflow/module shapes, not just cosmetics — so a lint failure usually means the code is actually wrong, not just badly formatted. Never disable a `@medusajs/*` rule to make lint pass; fix the code.
- No semicolons. Double quotes, 2-space indent.
- Files: kebab-case. Types/classes: PascalCase. Functions/variables: camelCase. DB columns: snake_case.
- No emojis in code, comments, or commit messages.

## Conventions

- **Backend routing is file-based.** A store endpoint is `src/api/store/<path>/route.ts` exporting `GET`/`POST`/etc. Don't add a router or register routes manually.
- **Business logic belongs in workflows**, not in route handlers. Routes resolve and run a workflow; workflows compose steps.
- Adding a task to `turbo.json` requires declaring its `outputs`, or Turbo will cache nothing/the wrong thing.

## Common Mistakes

- Running storefront commands without checking that `apps/storefront/` exists.
- Assuming a package manager instead of detecting it, or running a command that creates a second lockfile.
- Installing a dependency at the root instead of inside the app that needs it (`cd apps/backend && <pm> add <pkg>`).
- Editing a custom module's model without running `<pm> exec medusa db:generate <module>` — the migration is missing and the change silently never applies.
- Writing raw SQL or importing DB clients directly in the backend instead of going through module services / workflows.
- Calling the Medusa API from the storefront without `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`; requests fail with a publishable-key error, not an obvious 401.
- Running the test task without a reachable PostgreSQL — integration suites need a live DB.
- Silencing `@medusajs/*` ESLint rules instead of fixing the underlying pattern.

## Off-Limits

- `apps/backend/.medusa/`, `.next/`, `dist/`, `out/`, `.turbo/` — build output, excluded from the workspace and regenerated.
- The lockfile (`pnpm-lock.yaml`, `yarn.lock`, `package-lock.json` — whichever this install produced) — never hand-edit or delete; change it only as a side effect of a package manager command.
- `.env` / `.env.local` — never commit, print, or copy secret values out of them. Edit `.env.template` instead when documenting a new variable.
- Existing migrations in `src/modules/*/migrations/` — add a new migration rather than rewriting one that may already have run.
- Don't run destructive DB commands (drops, `db:migrate --help`-style flags that reset state) against the user's database without explicit confirmation.
