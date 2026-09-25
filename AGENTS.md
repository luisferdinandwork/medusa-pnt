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
```

## Storefronts (multi-store)

One Medusa backend serves several storefronts. Each storefront is a **sales channel + publishable API key + `Storefront` record**:

- Products, orders, stock and customers are managed per sales channel in the normal Medusa admin pages.
- Branding and homepage copy (name, tagline, announcement bar, hero) live in the `storefront` custom module (`apps/backend/src/modules/storefront`), linked to the sales channel, and are edited in the admin under **Storefronts** (`src/admin/routes/storefronts`). Admin API: `/admin/storefronts`; workflows: `create-storefront`, `update-storefront`.
- A storefront reads its own record from `GET /store/storefront`, resolved from the publishable key it already sends (cached ~60 s). The static presets in `apps/storefront/src/lib/store-config.ts` and the fallback in `apps/storefront-b2b/src/lib/store-config.ts` are used only if the record is missing or the backend is down. Never hardcode store copy in components; add a field to the module instead (new migration, do not edit an existing one).
- `apps/storefront` = SPECS Teamsport / SPECS Run (one codebase, chosen by `NEXT_PUBLIC_STORE_KEY` + its publishable key). `apps/storefront-b2b` = SPECS B2B, login required (see its `AGENTS.md`).

## Content (blog & product stories)

Editorial content lives in the `content` custom module (`apps/backend/src/modules/content`) and is edited in the admin under **Blog & Artikel** and **Cerita Produk**.

- `Article` = a blog post. Besides the body it carries the SEO fields a crawler reads (`seo_*`, `canonical_url`, `noindex`) and the GEO fields an answer engine quotes (`answer_summary`, `key_takeaways`, `faqs`, `sources`, `geo_locale`, `geo_target_area`). The storefront renders both the page and its JSON-LD from one record.
- `ProductStory` = one story per product silo (a family such as "Sepatu Bola FG"). `product_handles` decides which product pages show it, so a story is the hub page that ties a silo together.
- Both have `storefront_key`: a storefront key scopes the record to one shop front, `null` shows it on all of them. Store routes resolve the key from the publishable API key (`src/api/utils/storefront-scope.ts`) and only ever return `status = "published"`.
- Admin API: `/admin/articles`, `/admin/product-stories` (GET list with `q`/`status`/`storefront_key`/`limit`/`offset`, POST create, and `:id` GET/POST/DELETE). Store API: `/store/articles`, `/store/articles/:handle`, `/store/product-stories`, `/store/product-stories/:handle`.
- Workflows: `create|update|delete-article`, `create|update|delete-product-story`. Deletes are soft deletes so the compensation can restore them.
- Storefront pages: `/blog`, `/blog/[handle]`, `/stories`, `/stories/[handle]`, plus the story teaser on product pages and the journal strip on the homepage. Article and story bodies are Markdown, rendered by `src/lib/util/markdown.tsx` into React elements (never raw HTML). Structured data is built in `src/lib/util/json-ld.ts`.
- `related_product_handles` / `product_handles` reference products **by handle**, not id, so content survives a reseed. A handle that no longer exists is skipped silently.

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
