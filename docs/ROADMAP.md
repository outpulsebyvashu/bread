# breadPOS — Build order

Each phase ships something usable. Review with the owner after each.

1. **Foundation**: Next.js + TS + Tailwind scaffold, Supabase project, run `supabase/schema.sql`, seed (outlet, tables, sample menu), auth + role middleware, `src/lib/{supabase,roles,watch,audio,print}`. PWA manifest + service worker (shell only).
2. **Admin**: categories/items/modifiers/recipes CRUD, ingredients + restock, staff management, settings.
3. **Cashier POS**: menu grid, modifiers, cart, `place_order`, payments, receipt print, shifts.
4. **Kitchen KDS**: realtime tickets, voice + beep + 30 s repeat, KOT print, 86 toggle.
5. **Customer QR**: `/o/[outlet]/[table]`, tracking, QR generator in admin.
6. **Captain + Manager**: table map, bill request, approvals, live floor, reports.
7. **Niro**: mock adapter → real adapter, outbox worker, lookup/redeem UI, earn/reverse.
8. **Hardening**: RLS tests per role, load test, offline queue (optional), ESC/POS printing (optional), multi-outlet menu/inventory.

## Known gaps in the draft schema
- `schema.sql` is untested; run it on a scratch Supabase project and fix errors first.
- Required-modifier validation is client-side only; add to `place_order`.
- No table-state/"bill requested" column yet (add to `orders` or a `table_sessions` table).
- Stock is global, not per outlet.
- Order numbers use a global sequence; consider a daily reset per outlet.
- Split bills per item not modeled (split by payments only).
