# breadPOS audit — 8 Nov 2026

Scope: whole repo at commit `069f472`. Read: docs, every route handler, session/auth, the engine (all commands), money, seed/demo data, store, login/approval/customer screens, service worker, config.
Checked by: `npm test` (63 tests before, 71 after). **Not run**: `next build`, lint, type-check, any screen in a browser (dependencies could not be installed in the audit environment). No screens were changed beyond hiding demo hints in a live build.

## Verdict
The POS logic is in good shape: integer-paise money, split bills that add up exactly, GST bills with credit notes, shift cash counts, approvals, a roll-back-on-failure command engine, solid tests. What stops it going live is **where the data lives** and **a few things that were safe only because it was a demo**.

## Fixed in this pass

| # | Severity | Flaw | Fix |
|---|---|---|---|
| 1 | Critical | Login page printed every staff phone and PIN, including the Owner's `0000`, from code shipped to every browser. Anyone could sign in as admin. | Sample sign-ins now come only from the server-rendered login page and only in a demo build (`NODE_ENV` ≠ production, or `NEXT_PUBLIC_BREADPOS_DEMO=1` at build). "Demo PIN/OTP" hints follow the same switch. Screens look identical in demo. |
| 2 | Critical | Fixed Niro code `123456` was accepted whenever the engine ran, so anyone could "sign in" as any Niro member by phone number (reads name and points) and the cashier redeem took it too. | Accepted only while the `demoMode` setting is on; otherwise a clear "Niro sign-in is not switched on yet". |
| 3 | Critical | Table QR codes were `sha256("table-T1")` etc. — computable by anyone who reads the (public) repo, and the docs call this code "the secret in the QR". New and rotated codes used the table id or the clock. | Random 72-bit codes everywhere (seed, new table, rotate). Existing codes in saved data stay valid until the owner rotates them. |
| 4 | High | A live build would start with the sample staff and PINs. | `OWNER_PHONE` + `OWNER_PIN` create a single owner for a live start (`createLiveState`); no sample staff, members or rewards. Demo builds unchanged. |
| 5 | High | "Reset demo" wiped all data for the owner with one request, in any mode. | Refused unless `demoMode` is on. |
| 6 | High | PINs stored as unsalted SHA-256 of a fixed string. A 4–6 digit PIN falls to a lookup table instantly if the data file leaks; equal PINs looked equal. | Per-person salted scrypt, constant-time compare. Old hashes still work and are replaced at next sign-in. Unknown phone numbers cost the same time as a wrong PIN. |
| 7 | High | Settings accepted any field and any type (`NaN`, strings, extra keys written into state). | Whitelist with type and range checks; outlet code limited to letters, numbers, dashes (it goes into web addresses). |
| 8 | Medium | Staff `role` was not validated, and the only owner could demote or deactivate themselves and lock everyone out. | Role must be a real role; at least one active owner must remain. |
| 9 | Medium | Niro points were taken when a reward was applied but never given back if the discount was removed or replaced; a second reward on the same check burned points while only one discount applied. | Points return when the pending reward discount is removed or replaced; a second reward is refused until the first is removed. |
| 10 | Medium | Session signature compared as plain text (timing leak). | `crypto.subtle.verify`. |
| 11 | Medium | No browser security headers. | `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy (the app uses no camera, mic, location or Payment API), HSTS, no `X-Powered-By`. |

Tests for 2–3 and 5–9 are in `src/lib/pos/hardening.test.ts`.

## Open — needs a decision or a real environment

| # | Severity | Item | Why it is open |
|---|---|---|---|
| A | **Blocker** | **Storage.** All data is one JSON file (`.data/breadpos.json`) written with `node:fs` by a single process. It cannot run on Cloudflare Workers (no disk, many instances), has no backup, and every command copies and rewrites the whole state while `audit`, `bills`, `payments`, `stockMoves` only grow, so it slows down month by month. | Stack decision (`CLAUDE.md`: ask before changing the stack). Options: **Supabase Postgres** as documented (best fit for realtime + RLS, but needs the schema rebuilt, item C), or **Cloudflare Durable Object / D1** (stays on Cloudflare, the engine can be reused almost as it is, but is not what the docs chose). |
| B | High | Sign-in one-time pass list and login lockouts live in process memory. With more than one instance a pass can be replayed and lockouts do not hold. | Solved by A. |
| C | High | `supabase/schema.sql` (16 tables, "untested draft") models a simpler POS than the one in the engine: no checks/KOTs/bills/GST series/credit notes/UPI payments/day close/roster/consents. `src/lib/supabase/*` and `src/lib/watch` are unused. | Must be regenerated from `src/lib/pos/types.ts` and tested on a scratch project as part of A (if Supabase). |
| D | Medium | Manager-PIN approval lockout is global: five wrong PINs by anyone block every approval for a minute. | Changing it touches permission logic (ask-first rule); needs a per-requester design. |
| E | Medium | A Niro reward overwrites a manager-approved discount already on the check. | Money logic — owner to decide the rule (block, stack, or keep the larger). |
| F | Medium | UPI is simulated (`provider: "simulated"`), card references are typed in, Niro is a mock. No webhook signature check exists because no provider is chosen. | Needs provider and Niro API decisions. |
| G | Medium | Public QR endpoints have no rate limit (order spam). | Best done at Cloudflare (WAF rule or Rate Limiting) once deployed. |
| H | Low | No Content-Security-Policy. | Must be tried against a real build; Next.js inline scripts need nonces. |
| I | — | Build, lint, type-check and on-device checks (phone viewport, print, sound) were not run here. | Run `npm i && npm run build && npm test` once; takes minutes. |

## Path to a POS you can run a shop on
1. **Decide A** (Supabase or Cloudflare-native). Everything else is small by comparison.
2. Move the store behind the same functions (`readState`, `runCommand`, `mutateState`) so no screen changes; keep `dispatch()` as the single place rules live.
3. Add the Cloudflare deploy (OpenNext + `wrangler.jsonc`, worker name `niro-bread`), set `SESSION_SECRET`, `OWNER_PHONE`, `OWNER_PIN` as secrets.
4. Pick the UPI provider and confirm the Niro API; replace the two mocks.
5. One week of the cafe running in parallel with paper bills before relying on it.
