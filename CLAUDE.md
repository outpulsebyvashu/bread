# breadPOS — instructions for Claude Code

You are taking over this project. The architecture is designed; the app code is not written yet. Start from `docs/ROADMAP.md` phase 1.

## What this is
A realtime restaurant/cafe POS (PWA) for Vashudev's F&B ventures (bread/cafe brands, The Dough Theory, etc.), with direct integration to **Niro.Cards** (his loyalty platform). Roles: customer (QR), captain, kitchen, cashier, manager, admin.

## Read first
1. `docs/ARCHITECTURE.md` — stack, routes, lifecycle, security
2. `docs/USERFLOWS.md` — what each role does
3. `docs/NIRO_INTEGRATION.md` — adapter contract (API unconfirmed → use mock)
4. `supabase/schema.sql` — source of truth for data and permissions (untested draft)

## Stack
Next.js App Router + TypeScript + Tailwind, Supabase (Postgres/Auth/Realtime), Cloudflare deploy (OpenNext/Workers). PWA.

## Hard rules
- **Never trust the client for money.** Prices, tax, discounts, totals are computed in Postgres RPCs. Clients do not insert/update `orders`, `order_items`, `payments`, `shifts`.
- **Security lives in RLS + RPCs.** Next.js middleware is only UX. Any new table gets RLS enabled and explicit policies.
- Service-role key and Niro secrets: server only, never in client bundles or committed files. `.env*` is gitignored.
- Niro calls on write paths go through `niro_outbox` (retry, idempotent on order ref). POS must work when Niro is down.
- Schema changes are migrations in `supabase/migrations/` (keep `schema.sql` as the current full snapshot).
- Audio alerts need a user gesture to unlock; always provide an "Enable sound" button on KDS/captain/cashier.

## UI conventions
- Mobile-first; the owner builds and reviews from a phone. Touch targets ≥ 44 px, no hover-only actions.
- Currency ₹, whole rupees shown without trailing `.00`.
- Print: 80 mm CSS print area for KOT and receipt.
- Keep screens fast: one screen per role, minimal navigation.

## Working with the owner
- Direct, iterative, concise. Prefer short updates with a clear next step.
- Build one phase at a time and show a result before moving on.
- Ask before: changing the stack, adding paid services, or changing money/permission logic.
- Niro API details are unconfirmed: use the mock adapter and flag it; do not invent real endpoints.

## Commands (once scaffolded)
Document dev/build/test/deploy commands here as they are created.

## Definition of done per feature
Works on a phone viewport, enforced by RLS for the right roles only (test as anon and as each role), realtime updates without refresh, no secrets in client code.
