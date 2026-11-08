# breadPOS — User flows by role

## Staff sign-in
One login page for everything (`auth.niro.cards/login`). Staff enter their phone number and PIN and are sent to the right app for their role: cashier to POS, kitchen to Kitchen, captain to Captain, manager to Manager, owner to POS Admin. Opening an app while signed out sends you to the login and back. Managers and the owner can move between the apps their role allows without typing the PIN again. Wrong details get one general error, and a number locks for a minute after five failures. A forgotten PIN is reset by the owner in Staff.

Apps: POS (`bread.niro.cards`, cashiers), Kitchen, Manager and Items (same domain), Captain (`workforce.niro.cards`), POS Admin (`admin.outpulse.company`, owner, can run all the others from "Run the shop"). Customers use `niro.cards` with no sign-in.

## Customer (QR, no login required)
1. Scan table QR → `/o/[outlet]/[table]`.
2. Optional: "Sign in with Niro" (phone + OTP) → see points and available rewards.
3. Browse menu; sold-out items are disabled live.
4. Customise (modifiers, notes) → cart.
5. Optional: apply a Niro reward (shown as a discount line).
6. Place order → tracking screen: Received → Preparing → Ready (poll `get_order` every ~4 s).
7. Pay at the counter (or UPI later). On payment, points are credited and Niro notifies them.
Edge: item goes out of stock between add and place → clear error, cart stays.

## Captain (waiter)
1. Log in → table map (free / occupied / bill requested).
2. Open table → add items on phone → send (KOT fires on KDS).
3. Hears/sees "Order N ready" for his tables → serves → marks served.
4. Customer asks for bill → "Request bill" flags the table for the cashier.
Cannot: take payment, discount, cancel, edit menu.

## Kitchen / bar
1. Open `/kds`, tap "Enable sound".
2. New ticket: beep + voice read-out; repeats every 30 s until accepted.
3. Accept → preparing; Done → ready (alerts captain + cashier).
4. Print KOT if needed; mark an item "sold out" (86).
Cannot: see prices/payments, cancel.

## Cashier
1. Open shift (cash float).
2. Bill queue: QR orders and table bills, newest first.
3. Identify customer: scan Niro QR or enter phone → Niro points/rewards appear.
4. Redeem reward → discount line (cap applies; above cap needs manager).
5. Take payment: cash / UPI / card / split → receipt print.
6. Close shift: enter counted cash → expected vs counted variance logged.
Cannot: cancel paid orders, edit menu/stock.

## Manager
1. Live floor dashboard: open orders, waiting times, unpaid bills.
2. Approvals: over-limit discounts, cancels/voids (reason mandatory; stock restored; Niro reversal queued if paid).
3. Receive/adjust stock; toggle availability.
4. Reports: day sales, payment split, top items, shift variances, low stock.

## Admin / owner
1. Menu: categories, items, modifier groups, recipes (stock deduction).
2. Staff: create users, assign role, deactivate.
3. Tables + QR generation/print per outlet.
4. Settings: shop name, tax %, discount cap.
5. Niro: link outlet (`niro_outlet_code`), earn rate, reward mapping, connection test.
6. Audit log and multi-day reports.

## Other roles (add when needed)
- **Delivery/aggregator** (Swiggy/Zomato inbound orders): treated as a `source`; later.
- **Auditor/accountant**: read-only reports role.
