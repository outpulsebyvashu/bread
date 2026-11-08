# breadPOS

Realtime POS for cafes and restaurants: QR ordering, captain app, kitchen display with voice alerts, cashier billing, manager controls, item-based inventory, and Niro.Cards loyalty integration.

Status: all role apps and the POS engine work as a single-process demo (sample outlet, local JSON store, 71 tests). Not yet live-ready: storage must move to a real database. See `docs/AUDIT.md` for what is fixed and what is open.

- `docs/ARCHITECTURE.md` · `docs/USERFLOWS.md` · `docs/NIRO_INTEGRATION.md` · `docs/ROADMAP.md`
- `supabase/schema.sql` — database, roles, RLS, RPCs
