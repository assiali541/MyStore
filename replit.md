# Maison Luxe — Luxury Clothes E-Commerce

A full-stack luxury fashion e-commerce platform with a customer storefront (guest checkout, no account required) and a JWT-protected admin dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/luxe-store run dev` — run the storefront (port 21248, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string (auto-provisioned)
- Required env: `JWT_SECRET` — strong random secret for admin JWT signing (set as a Replit Secret)

## Seed / Default Credentials

- Admin login: **username** `admin` / **password** `admin123`
- Sample coupon code: `LUXE20` (20% off)
- 10 seed products across 5 categories

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS + Wouter routing + React Query
- API: Express 5 + pino logging
- DB: PostgreSQL + Drizzle ORM
- Auth: bcryptjs + jsonwebtoken (admin-only JWT)
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec in `lib/api-spec/openapi.yaml`)
- Build: esbuild (CJS bundle for API)

## Where things live

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle table definitions (admins, products, categories, orders, order_items, coupons, settings)
- `artifacts/api-server/src/routes/` — Express route handlers (auth, products, categories, orders, coupons, settings, dashboard, upload)
- `artifacts/api-server/src/lib/auth.ts` — JWT sign/verify/middleware
- `artifacts/luxe-store/src/` — React frontend
  - `pages/` — customer pages (home, shop, product-detail, categories, cart, checkout, order-confirmation, wishlist)
  - `pages/admin/` — admin pages (login, dashboard, products, categories, orders, coupons, settings)
  - `contexts/` — CartContext, WishlistContext, AdminAuthContext
  - `layouts/` — StorefrontLayout, AdminLayout

## Architecture decisions

- Guest checkout only — customers never create accounts; orders are linked to phone+name
- All pricing computed server-side from DB; frontend prices are never trusted
- Checkout wrapped in a PostgreSQL transaction with `SELECT FOR UPDATE` to prevent race conditions / oversell
- JWT secret is required at startup; no hardcoded fallback — fails fast if env is missing
- File uploads (product/category images) served as static files from `/api/uploads/`; multer validates jpg/png/webp only, max 5 MB
- Cart and wishlist stored in localStorage only — no server-side persistence

## Product

- **Storefront**: Home (hero + featured + categories), Shop (filtered grid), Product detail (size/color picker, gallery), Cart, Guest checkout, Order confirmation, Wishlist
- **Admin panel** (`/admin`): Dashboard stats, Orders management + status updates, Products CRUD, Categories CRUD, Coupons management, Store settings

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- After any OpenAPI spec change, always run `pnpm --filter @workspace/api-spec run codegen` before touching frontend code
- DB schema changes: run `pnpm --filter @workspace/db run push` (dev). Production schema updates go through the Publish flow automatically
- The upload route (`POST /api/admin/upload`) is NOT in the generated hooks — call it with raw `fetch` using `Authorization: Bearer <token>`
- Run `pnpm run typecheck:libs` after any `lib/*` package change before checking artifact packages
