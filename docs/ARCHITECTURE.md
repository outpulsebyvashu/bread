# breadPOS — Architecture

Restaurant/cafe POS as an installable web app (PWA), realtime across devices, role-based, with Niro.Cards loyalty built in.

## Stack (decided)
| Layer | Choice | Why |
|---|---|---|
| App | Next.js (App Router) + TypeScript + Tailwind, PWA | One codebase for phone, tablet, Chromebook; owner works from a phone |
| Backend | Supabase (Postgres, Auth, Realtime, Edge Functions) | Matches the owner's other projects; RLS gives real role security |
| Hosting | Cloudflare (Workers via OpenNext, or Pages) | Owner's standard; Niro already lives there |
| Niro link | Outbox table + Worker/Edge Function | Retry-safe, POS keeps working if Niro is down |
| Realtime | Supabase Realtime on `orders`, `order_items`, `items`, `ingredients` | Live sync, KDS alerts |

## Surfaces (routes) and who may open them

Six staff apps and the customer app, each with its own session cookie, web manifest and icon. There is **one login** for all of them.

| Domain | Serves |
|---|---|
| `auth.niro.cards` | The one login (`/login`), phone number + PIN |
| `bread.niro.cards` | POS (`/pos`), Kitchen (`/kds`), Manager (`/manager`), Items (`/items`) |
| `workforce.niro.cards` | Captain (`/captain`) |
| `admin.outpulse.company` | POS Admin (`/admin`), which can also run every other app from its "Run the shop" tab |
| `niro.cards` | Customer ordering: page `/o/{outlet-code}/{table-code}`, API `/api/orders/{outlet-code}/{table-code}` |

Set the `*_ORIGIN` variables in `.env.example` to turn this on. With none set, everything runs on one address.

**How sign-in moves between domains.** An app with no session sends the person to `auth.niro.cards/login?app=<app>`. After the phone and PIN check, the login domain remembers the sign-in (its own cookie) and redirects to `<app domain>/auth/callback?token=...` with a signed pass that works once and for 60 seconds. The app domain swaps it for its own session cookie and lands on the app's home. People go to the app they asked for if their role allows it, otherwise to their own role's app (cashier to POS, kitchen to Kitchen, captain to Captain, manager to Manager, owner to Admin). Browsers cannot share cookies between `niro.cards` and `outpulse.company`, which is why a redirect pass is used. Signing out of one app also ends the login-domain sign-in, but other apps' sessions last until they expire (12 hours) or the person is deactivated, which takes effect at once.

**Before going live with separate servers:** the demo store is one process, so all domains must be served by it. Separate deployments need the shared database (Supabase stage), including for the one-time pass list, and the same `SESSION_SECRET` everywhere.


| Route | Role | Purpose |
|---|---|---|
| `/o/[outlet]/[table]` | public (anon) | Customer QR ordering + tracking, optional Niro sign-in |
| `/captain` | captain | Table map, take orders, ready alerts |
| `/kds` | kitchen | Ticket board, voice + beep + repeat alert, KOT print, 86 items |
| `/pos` | cashier | Bill queue, Niro lookup/redeem, payments, shift open/close |
| `/manager` | manager | Live floor, approvals (void/discount), stock receive, reports |
| `/admin` | admin | Menu, modifiers, recipes, staff, tables+QR, tax, Niro settings |
Role gating happens twice: Next.js middleware (UX) and Postgres RLS/RPC (security). Never rely on the first alone.

## Data model
See `supabase/schema.sql` (source of truth). Key ideas:
- **Roles**: `staff(user_id, role)`; `my_role()` / `is_role()` used by every policy and RPC.
- **Orders are write-protected.** Clients can only read; all writes go through `SECURITY DEFINER` RPCs: `place_order`, `set_status`, `set_discount`, `take_payment`, `cancel_order`, `open_shift`, `close_shift`. Prices are recomputed server-side from `items` + `modifiers`.
- **Item-based inventory**: `recipe(item, ingredient, qty)`. `place_order` decrements stock; `cancel_order` restores it; triggers set `items.out_of_stock` so sold-out items vanish live.
- **Anon customers** can read the menu and call `place_order`/`get_order` only.
- **Money** is `numeric(10,2)`; tax from `settings.tax_pct`; discounts reduce the taxable base.
- **Audit**: discounts and cancels write `audit_log`.
- **Multi-outlet ready**: `outlet_id` on staff/orders/shifts/tables; menu and inventory are global in v1 (see Roadmap).

## Order lifecycle
`new → preparing → ready → served`, or `cancelled` (manager/admin only).
- Created by: customer (QR), captain, or cashier.
- Kitchen moves `new→preparing→ready`; captain/cashier move `ready→served`.
- Payment is independent of status (pay-later for dine-in, pay-first for takeaway): `orders.paid` flips when payments ≥ total.

## Realtime & alerts (client)
- `watch()` helper: subscribe to table changes, debounce 250 ms, refetch; poll every 30 s as fallback; refetch on tab focus.
- KDS: audio must be unlocked by a user tap ("Enable sound"). New order → beep + `speechSynthesis` read-out of table + items. **KOT barking**: every 30 s, re-announce while any order is still `new`.
- Captain/cashier devices: speak "Order N ready" on transition to `ready`.
- Printing: `window.print()` against an 80 mm CSS print area (KOT and receipt). Direct thermal printing (ESC/POS over WebUSB/Bluetooth) is a later option.

## Niro.Cards integration
See `docs/NIRO_INTEGRATION.md`. In short: POS never calls Niro inline for money-critical paths; it writes `niro_outbox`, and a worker delivers. Member lookup and reward validation are synchronous reads through a server route (never from the browser with secrets).

## Security notes
- Anon key is public by design; safety comes from RLS. Test policies with the anon and each role.
- Service-role key only in server routes/workers, never shipped to the client.
- Admin/Niro API secrets in Cloudflare secrets.
- Staff onboarding: admin creates auth user + `staff` row. Optional later: Outlet Code + PIN login to match Niro Workforce.

## Offline
v1 requires connectivity (realtime POS). Service worker caches the shell only. Offline order queue is a Roadmap item, not a v1 promise.

## Repo layout (target)
```
src/app/(public)/o/[outlet]/[table]/   customer
src/app/(staff)/{captain,kds,pos,manager,admin}/
src/lib/{supabase,roles,watch,audio,print,niro}/
supabase/{schema.sql,migrations/,seed.sql}
workers/niro-outbox/                   drains niro_outbox
docs/
```
