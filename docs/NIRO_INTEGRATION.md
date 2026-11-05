# Niro.Cards integration (proposed contract)

Status: **PROPOSED. The real Niro API has not been confirmed.** Build against the mock adapter, then swap in the real endpoints. Niro context: customer app (phone + OTP), Partner app (cafe owner), Workforce app (staff, Outlet Code + PIN), Admin; points/stamps, referrals and geofenced offers are live.

## Principle
POS stays usable if Niro is down. Reads (lookup, rewards) are live calls through a server route; writes (earn, reverse) go through `niro_outbox` and are retried.

## Adapter interface (`src/lib/niro/index.ts`)
```ts
interface NiroAdapter {
  lookupMember(q: { phone?: string; qrToken?: string }, outlet: string): Promise<Member | null>;
  listRewards(memberId: string, outlet: string): Promise<Reward[]>;
  redeem(memberId: string, rewardId: string, orderRef: string): Promise<{ ref: string; discount: number }>;
  earn(memberId: string, amount: number, orderRef: string): Promise<{ points: number }>;   // idempotent on orderRef
  reverse(memberId: string, orderRef: string): Promise<void>;                                // idempotent
}
```
Implementations: `mock.ts` (in-memory/Supabase table, used until Niro is confirmed) and `http.ts` (real).

## Flows
- **Identify**: customer signs in via Niro OTP on the QR page, or cashier scans/enters phone → `lookupMember` → `orders.niro_member_id`.
- **Redeem**: cashier picks reward → server route calls `redeem` → on success calls RPC `set_discount(order, amount, reason, niro_ref)`. Redemption is *reserved*, not final, until payment.
- **Earn**: `take_payment` flips `paid` → inserts `niro_outbox(kind='earn')` → worker calls `earn` with `orderRef` as idempotency key → stores `niro_points_earned`.
- **Reverse**: `cancel_order` on a paid order → `niro_outbox(kind='reverse')`.
- **Outlet link**: `outlets.niro_outlet_code` maps this outlet to a Niro Partner outlet.
- **Staff (optional)**: reuse Niro Workforce credentials for POS login.

## Outbox worker (`workers/niro-outbox`)
Cron every minute: select `pending` rows (limit 50) → call adapter → mark `done`/increment `attempts` + `last_error`; mark `failed` after 8 attempts and surface in `/admin`.

## Open questions for the owner
1. Does Niro expose an HTTP API / Supabase tables, or should the contract above be implemented on the Niro side?
2. Same Supabase project/auth as Niro, or separate with API calls? (Default: separate.)
3. Earn rule: points per ₹? stamps per visit? Handled by Niro or sent from POS?
4. Do QR-order customers need to be Niro members, or is it optional?
