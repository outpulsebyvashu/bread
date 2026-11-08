# User flows of Posist/Restroworks, Rista, DotPe, LimeTray and UrbanPiper (for breadPOS)

Research date: 2026-11-05. Petpooja is out of scope.

**How to read these notes**

- **Labels:** [docs] = vendor help centre or API documentation. [marketing] = vendor product page, vendor blog or vendor-written app store text. [third-party] = press, review sites, competitors, or integrators' documentation.
- **"Excerpt only":** the claim comes from a search result excerpt, and the page itself was not opened. Treat it as weaker evidence.
- **Paraphrase risk:** opened pages were read through a summarising fetch tool. Check quoted wording against the live page before reusing it verbatim.
- **Numbered flows:** these list only the steps the source shows. Missing steps are listed under Gaps and have not been filled in.
- **Mockup data:** Restroworks pages use dollar amounts and US-style mockups, so sample figures are illustrations, not measurements.

**Evidence strength by vendor**

| Vendor | What was found | What this means |
|---|---|---|
| UrbanPiper | Public API docs and help centre | Only vendor with real step-by-step documentation. Strong on aggregator flows. It is not a dine-in POS source. |
| Posist/Restroworks | Detailed product pages only. posist.com [301-redirects to restroworks.com](https://www.posist.com/restaurant-pos-system/). No public help centre or manual was found across several searches. A third party gives [support@posist.com](https://kb.7shifts.com/hc/en-us/articles/14222007056147-Restroworks-POS) as the contact (excerpt only). | Features are well described, but click-level flows are **not verified**. The requested depth was only partly achievable. |
| Rista (owned by DotPe) | App store text and third-party listings. ristaapps.com returned only the word "Rista" to the fetch tool. | Feature existence only. |
| DotPe | One current landing page, a waiter app listing, and press from 2020-2021 | Feature existence and a dated QR flow. |
| LimeTray | Product pages. No help documentation was found. | Thin. Its [homepage](https://limetray.com/) displayed a "Something went wrong!" message when fetched. Current product status was not established. |

**Corporate context**

- DotPe acquired Rista in September 2021, and Rista was to continue as a standalone business — [YourStory, excerpt only](https://yourstory.com/2021/09/o2o-commerce-platform-dotpe-enters-pos-space-with-rista-acquisition) [third-party]. One timeline gives 2022 instead — [Indian Startup Times, excerpt only](https://www.indianstartuptimes.com/startup-deep-dive/rista-deep-dive/) [third-party].
- The Rista Billing iOS app's seller is Dotpe Private Limited — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing]. DotPe and Rista should therefore be read as related product lines. How DotPe's current "Dotpe POS" relates to Rista POS was **not verified**; the [DotPe landing page](https://dotpe.in/landing.html) does not mention Rista.

## Captain/waiter: table view, order taking, KOT send, table transfer/merge, bill request

### Takeaway
Restroworks shows the fullest captain feature set: floor view, modifiers, KOT per station, seat and course entry, and settling at the table. No vendor documents table transfer, table merge or bill request step by step. DotPe's waiter app is the only source that explicitly names table switching and bill approval.

### Cited Findings

**Restroworks: sequence shown on product pages (not a documented procedure)**
1. Table view: a live floor plan shows table status, guest counts and timers, and the server can seat guests from the tablet — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing]. The POS page also shows covers, bill total and running time per table — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing]. Tables are colour-coded, and the floor plan builder supports drag and drop, CAD import and zones — [FOH](https://www.restroworks.com/front-of-house-software/) [marketing].
2. Order entry: one queue covers dine-in, online, delivery and takeout. Items take modifiers and special instructions — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing].
3. Seat and course entry (fine dining): "Enter each course by seat number". The next dish fires "only once the last one's cleared". The table mockup shows course states Cleared, Fired and Hold — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].
4. KOT send: each order goes to the right station (for example Grill or Bar) as its own KOT, with modifiers, instructions and table details intact — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing].
5. Check and settlement: servers can "pull up the check" and take card, wallet or cash at the table — [FOH](https://www.restroworks.com/front-of-house-software/) [marketing]. "Servers take the order and settle the check on the same card machine" — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].
6. Bill request: tables can show a "ready to pay" status. A guest-initiated bill request is not described — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].

**Restroworks: table transfer and merge**
- Merge and table-to-table transfer are absent from the POS, FOH, tablet and fine-dining pages — [POS](https://www.restroworks.com/restaurant-pos-system/), [FOH](https://www.restroworks.com/front-of-house-software/), [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/), [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].
- A Capterra reviewer says "We can move the items from one table to another table with the manager permission only". The review pages returned 403, so the exact page and date are unconfirmed — [Capterra, excerpt only, one of the pages returned](https://www.capterra.com/p/142877/Restroworks/reviews/?page=7) [third-party].
- An older Posist page mentioned "easy transfer between tables". The exact page was not pinned down, and posist.com now redirects — [posist.com results, excerpt only](https://www.posist.com/restaurant-pos-system/) [marketing].

**DotPe and Rista**
- DotPe Waiter App: "Manage orders via table/order view"; "Accept/Reject orders, create offline orders directly from Dot Waiter"; "Receive payment notifications, bill approval, table management, table switching, and more" — [App Store](https://apps.apple.com/us/app/-/id6755459993) [marketing]. "Offline orders" is ambiguous here: it could mean staff-entered orders rather than orders taken without internet.
- DotPe handheld: "Take orders and payments at the table, in the queue or at the door" — [DotPe](https://dotpe.in/landing.html) [marketing].
- Rista POS: "Take orders on smartphones in restaurants or in field, available immediately on POS" — [store text via AppGoblin](https://appgoblin.info/apps/com.ristaapps.business) [marketing]. A Captain App is listed in a premium plan — [SoftwareSuggest, excerpt only](https://www.softwaresuggest.com/rista-pos) [third-party].

**LimeTray**
- Orders are punched in and the kitchen is notified by printed KOTs: "intimate the kitchen by printing KOTs" — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing]. The page does not mention a captain app or table management, though a listing names table management among its modules — [Techjockey, excerpt only](https://www.techjockey.com/detail/limetray) [third-party].

### Inferences
- The manager-permission report for table moves suggests such moves can be a controlled action in Restroworks, but it rests on one unverified reviewer.
- DotPe's "accept/reject" and "bill approval" imply that a waiter can sit between the diner and the kitchen or bill. The listing does not show when or how this happens.

### Gaps
- **Not verified for any vendor:** the steps for table transfer, table merge, moving a single item, and bill request.
- Whether a captain can discount, void or print a bill, and how a captain logs in or is assigned to tables, could not be verified.
- Whether a captain app works without internet by talking to a local server could not be verified. Restroworks only claims handheld offline operation (see the offline section).

## Kitchen: KOT routing by station, KDS actions, item availability

### Takeaway
Restroworks' KDS page gives the most specific action list: item-to-station mapping, stage flows, mirror groups, bump at three levels, recall, course hold and fire. Item availability ("86") is best documented by UrbanPiper for delivery channels. No dine-in POS source documents how an 86 reaches the captain or POS screen.

### Cited Findings

**Restroworks KDS** — all from the [KDS page](https://www.restroworks.com/kitchen-display-system/) [marketing]
- Routing: items map to stations, and each screen shows only its own work. Multi-step lines split into stages, and an item clears after passing through them.
- Setup check: a diagnostic flags unmapped items before service, for example "Loaded Fries isn't mapped to any station".
- Mirror groups: one ticket shows on several screens and closes only after every screen marks it done.
- Bump: at whole-ticket, single-item or combo-component level. "Bump & Print" does both in one action. Bump bar keys can be mapped to KDS actions.
- Recall: reopens an incorrectly closed ticket by touch, bump bar or search.
- Timing: tickets are labelled On time, Due soon or Delayed. Colours change automatically, and thresholds are set per location.
- Course control: items can be held until the table is ready, then fired with one tap.
- Views: a chef view shows running counts across open tickets. A modified-items view shows only tickets with modifiers. Negative modifiers, allergens and instructions are styled distinctly.
- Expo: treated as a station in routing, with a pass screen available.
- Paper: tickets can still print to the location's printers. Automatic failover when a screen dies is not described.
- Item availability: not mentioned on this page.

**Restroworks: cafe and channel**
- Tickets route to "bar, pastry, or kitchen" with "no paper and no manual handoff" — [Cafe](https://www.restroworks.com/cafe-management-system/) [marketing].
- Orders can be paused across aggregators by prompting an AI agent — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].

**Item availability: UrbanPiper**
- Prime: mark an item or modifier out of stock from the app and snooze it "for a set duration or indefinitely", with search and multi-location management — [Prime app](https://help.urbanpiper.com/store-manager/prime-app) [docs]. Live Orders has a Stock Control button, with no steps given on that page — [Prime web](https://help.urbanpiper.com/store-manager/prime-web-version/introduction) [docs].
- API: `POST /hub/api/v1/items/` with `enable`, `disable`, `enable_all` or `disable_all`, an optional `turn_on_at`, and up to 400 items or options per request. It has no platform field, so the action applies to every platform linked at that store — [Menu Toggle](https://api-docs.urbanpiper.com/downstream/api/endpoints/menu/menu-toggle.md) [docs].
- Processing: asynchronous, with a webhook per platform. Expected execution is 30 seconds, without a guarantee for aggregator propagation. The limit is 20 requests/min during 10:00-16:00 and 19:00-01:00 IST, otherwise 100/min — [Menu Toggle](https://api-docs.urbanpiper.com/downstream/api/endpoints/menu/menu-toggle.md) [docs].
- Doc inconsistency: the guide says a toggled-off item stays out of stock until explicitly turned on — [Item/Option](https://api-docs.urbanpiper.com/downstream/availability/item-option.md) [docs]. The API reference offers an optional `turn_on_at` — [Menu Toggle](https://api-docs.urbanpiper.com/downstream/api/endpoints/menu/menu-toggle.md) [docs]. These may be consistent if turn-on is manual unless `turn_on_at` is sent, but this was not confirmed.

**Others**
- Rista: "Kitchen display with color code scheme to monitor order processing time" — [store text via AppGoblin](https://appgoblin.info/apps/com.ristaapps.business) [marketing]. A listing mentions "auto stock-out logic" — [Capterra, excerpt only](https://www.capterra.co.uk/software/1073288/Rista) [third-party]. Out-of-stock marking and time-based availability are offered for aggregator catalogues — [Razorpay app store](https://razorpay.com/app-store/rista) [marketing].
- DotPe: "Kitchen tickets and bills print on their own, station by station"; "Tickets on a screen in the kitchen, accurate and in sync with the POS" — [DotPe](https://dotpe.in/landing.html) [marketing].
- LimeTray: printed KOTs are shown, and no KDS is mentioned — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing].
- UrbanPiper: optional scan-and-pack marks an order ready when item labels are scanned, and UrbanPiper must enable it — [Scan and Pack, excerpt only](https://help.urbanpiper.com/store-manager/prime-web/scan-and-pack-workflow) [docs].

### Inferences
- A useful distinction across sources: station mapping is a menu-setup task with a pre-service check, while availability is a live shift task with its own screen.

### Gaps
- **Not verified:** whether a kitchen user can mark an item unavailable from a Restroworks, Rista or DotPe KDS, and whether it then blocks captains, QR and aggregators together.
- **Not verified:** how a KOT cancellation or quantity reduction appears at the station in any product. No void-KOT print or KDS flow was found.
- Whether Restroworks KDS status flows back to the captain as "ready" was not shown. Its cafe counter status screen is the closest example (see the cashier section).

## Cashier: billing, split and merge, discounts, payment modes including UPI, reprints, day close

### Takeaway
Bill splitting and multiple payment modes are shown clearly. UPI is shown by name only for DotPe (a sample bill) and through payment partner lists elsewhere. Bill merge, the reprint procedure and day close are not documented by any of these vendors.

### Cited Findings

**Restroworks**
- Split options: "by person, item, category or even payment mode" — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing]. By cover, item or category, equally or by percentage, with each split check closed by its own payment mode — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing].
- Bill merge: not mentioned — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].
- Discounts: offers and loyalty-linked discounts are applied at billing — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].
- Payment modes: cash, card, contactless, wallets, QR pay and gift card, with UPI not named — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing]. Partners listed include PhonePe, Paytm, Razorpay and PayU — [FOH](https://www.restroworks.com/front-of-house-software/) [marketing].
- Counter flow on the customer display, as shown — [Customer display](https://www.restroworks.com/customer-order-display/) [marketing]:
  1. Items, tax, discounts and totals appear on the guest's screen as the cashier rings them in.
  2. The guest picks a tip (or none), then card, wallet or cash. One check can be split across modes.
  3. For QR payment, the screen shows "A dynamic QR code designed for that check, with the amount fixed in advance".
  4. The phone number is entered by the guest or cashier, configurable per location. Points move only after the guest approves the join prompt.
  5. A short rating prompt appears after the interaction.
  6. After payment, tokens move from preparing to ready on a separate counter status screen.
- Cafe speed: options sit on the item, and staff "Settle payments in just two touches" — [Cafe](https://www.restroworks.com/cafe-management-system/) [marketing].
- Reprints: tracked as an anti-theft flag type (10% of flags in the sample), with no reprint procedure shown — [Anti-theft](https://www.restroworks.com/restaurant-anti-theft-software/) [marketing].
- Day close: the procedure is not described. The closest statement is a daily sales report separating food and beverage — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].

**Others**
- Rista: bill splitting, discounts and itemised bills with taxes. Payments list PhonePe, Paytm, Razorpay and PayPhi — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing]. Razorpay's listing mentions UPI as part of Razorpay's own suite, without a Rista payment flow — [Razorpay app store](https://razorpay.com/app-store/rista) [marketing].
- DotPe: a sample bill shows "Paid · UPI" — [DotPe](https://dotpe.in/landing.html) [marketing].
- LimeTray: "view daily business reports generated automatically at day end"; split bills and discounts are not mentioned — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing].

### Inferences
- Restroworks' fixed-amount dynamic QR would avoid a cashier checking typed amounts. How payment confirmation reaches the POS is not shown, so this cannot be treated as a confirmed auto-reconciliation flow.

### Gaps
- **Not verified for any vendor:** UPI confirmation, including whether it is automatic, manual, or what happens on timeout or failure.
- **Not verified for any vendor:** day-close or shift-close steps, cash declaration, blocking on open tables, and business-date handling.
- **Not verified for any vendor:** bill merge steps, reprint permissions and "duplicate" markings, and refunds after settlement.

## Manager/owner: approvals for void/cancel/discount, user permissions, multi-outlet control, reports

### Takeaway
Restroworks' public material emphasises after-the-fact detection and review, plus a recorded manager override. It does not show a pre-approval sequence for voids or discounts. Its most explicit approval flows are for recipe changes and purchasing.

### Cited Findings

**Restroworks: voids, discounts and loss control** — all from [Anti-theft](https://www.restroworks.com/restaurant-anti-theft-software/) [marketing] unless noted
- Flag types and sample shares: void 39%, delete/edit 26%, discount 18%, reprint 10%, complimentary 7%.
- Timing logic: a void two minutes after print is treated as a correction, and the same void 45 minutes later as a decision. Sample flag: "Voided 45 min after print".
- Risk scoring: incidents are Low, Medium, High or Comp, weighing timing, frequency, payment context and who acted. Thresholds "are set per concept" at onboarding, and no numbers are given.
- Accountability: each incident records a Doer (who acted) and an Owner (who was responsible for the check). A manager override appears as "Manager card · J. Alvarez".
- Review sequence: "Flagged → Reviewed → Decision". Alerts can be approved or rejected from the mobile app (Cockpit).
- On-device approval: no on-device approval workflow is described on the tablet page — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing].

**Restroworks: permissions and multi-outlet**
- Role-based access by hierarchy, with examples of Regional Manager (12 outlets), Owner (all outlets) and Franchise (2 outlets) — [Anti-theft](https://www.restroworks.com/restaurant-anti-theft-software/) [marketing]. A permission matrix was not found.
- Central menu and price pushes across brands, formats and geographies — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].
- "Push change once, not outlet by outlet", while one outlet can keep its own price, item or modifier — [Cafe](https://www.restroworks.com/cafe-management-system/) [marketing].
- KDS behaviour and routing can be set at brand level — [KDS](https://www.restroworks.com/kitchen-display-system/) [marketing].

**Restroworks: explicit approval flows outside billing**
- Recipe: an outlet manager requests a change (example: pepperoni 40 g to 55 g), which stays pending until approved or rejected. Brand-level recipes require review of every change and deletion before going live — [Recipes](https://www.restroworks.com/restaurant-recipe-management-software/) [marketing].
- Purchasing: "Sign-off chains are configurable by level and by value". The example is a request "Above $2,000 limit" routed to a Finance Head — [Supply chain](https://www.restroworks.com/restaurant-supply-chain-management-software/) [marketing].

**Reports**
- Restroworks: "200+ real-time reports" and outlet comparisons — [Anti-theft](https://www.restroworks.com/restaurant-anti-theft-software/) [marketing]. Cover and check averages, menu engineering, and live sales in Cockpit — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing].
- LimeTray: "central business dashboard for all outlet sales" and outlet comparison — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing].
- Rista: multi-store and franchise management including royalties and fees, plus sales, customer and inventory reporting — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing]. Central menu control is listed — [Capterra, excerpt only](https://www.capterra.co.uk/software/1073288/Rista) [third-party].
- DotPe: its FAQ positions the product for single outlets and small chains — [DotPe](https://dotpe.in/landing.html) [marketing].
- Integration signal: bills voided or edited in Restroworks sync automatically to 7shifts — [7shifts, excerpt only](https://kb.7shifts.com/hc/en-us/articles/14222007056147-Restroworks-POS) [third-party].

### Inferences
- The "Manager card" implies some actions can need a manager credential at the moment of action. The source shows the resulting record, not the prompt, so which actions require it is unknown.
- The Approve workflow reviews flags after the event. It should not be mistaken for a manager approving a void before it happens.
- The time-since-print logic is a concrete design idea: the same void can be treated differently depending on elapsed time after print.

### Gaps
- **Not verified for any vendor:** which roles can void, cancel or discount; discount limits by role; PIN or OTP flows; remote approval before the action; mandatory reason codes on dine-in voids.
- The Rista and DotPe owner-app flows could not be verified. DotPe's "bill approval" is listed without a description of who approves or why.

## Inventory, recipes and central kitchen

### Takeaway
Restroworks' pages describe an unusually detailed commissary chain: outlet request, partial fulfilment, QR-labelled dispatch, receive, variance hold. They do not use the term "indent" on the supply chain page. Rista claims the same categories without steps.

### Cited Findings

**Restroworks: recipes** — [Recipes](https://www.restroworks.com/restaurant-recipe-management-software/) [marketing]
- Recipes list ingredients with quantities. Prep items are mapped separately and referenced by quantity (example: 120 ml of a 4 L batch sauce), with their own batch number, expiry and production site.
- Yields and trim are modelled. Example: 20 lb of chicken bought, 12.2 lb usable, so real cost per lb is about 64% above purchase price.
- Channel variants change portions and packaging. Item variants substitute a raw material, and each location can set a preferred substitute, logged for audit.
- Costing uses the average of recent purchases, last purchase price, or default vendor price.
- Bulk updates can swap one ingredient across several recipes.

**Restroworks: daily inventory** — [Inventory](https://www.restroworks.com/restaurant-inventory-management-software/) [marketing]
- Deduction happens when a menu item is billed, with portion-level deduction (half, regular, large). "Every POS sale updates inventory instantly". The POS page agrees: "Raw materials get deducted instantly when an item is billed" — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].
- Counts and invoice scanning are done from a phone.
- Waste is logged with a reason code (spoilage, overproduction, trim, plate waste), an optional photo and a cost.
- Par levels flag "Below par". Reorder alerts show days to stockout and a suggested order. FEFO batch tracking is included.
- Variance compares ideal and actual weekly (example: mozzarella 20 kg ideal, 24 kg actual).
- Cafe counts are "checked against theoretical usage throughout the day" — [Cafe](https://www.restroworks.com/cafe-management-system/) [marketing].

**Restroworks: central kitchen flow as shown** — [Supply chain](https://www.restroworks.com/restaurant-supply-chain-management-software/) [marketing]
1. Items are mapped to a supplying unit (raw materials from the warehouse, prep from the commissary).
2. Outlets raise requests against the commissary or warehouse. "If supply is less than what is asked, the balance stays open." "What they cannot fill moves up."
3. Cartons are packed against the request, QR-labelled and picked by rack number. "A carton for the wrong location fails at the scan."
4. Earliest-expiry batch is suggested first.
5. The receiver confirms quantities. If less is logged than was sent, "the quantity is held for review". A second rejection closes the transfer for audit, with no further stock adjustment.
6. Returns split into restocked and written-off stock, with a credit note in the example.

**Restroworks: purchasing** — [Supply chain](https://www.restroworks.com/restaurant-supply-chain-management-software/) [marketing]
- Three routes: central requisition to PO, direct PO, and standing order.
- Goods receipts are checked for quantity and quality. Three-way matching covers "quantity, rate and tax".
- "Indenting" is named on a Restroworks blog listing — [Restroworks blog, excerpt only](https://www.restroworks.com/blog/best-restaurant-inventory-management-software/) [marketing].

**Others**
- Rista: low-stock alerts, wastage, recipe costing, batch and expiry, supplier database and POs — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing]. Central kitchen transfers across outlets — [TrustRadius, excerpt only, page returned 403](https://www.trustradius.com/products/rista/details) [third-party]. Purchase, production, inventory and consumption linked to online channels, and multiple brands from one kitchen — [Razorpay app store](https://razorpay.com/app-store/rista) [marketing].
- DotPe: inventory is named in the POS bundle, without detail — [DotPe](https://dotpe.in/landing.html) [marketing].
- LimeTray: "Keep track of stock consumption, save recipes & control pilferage" — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing].

### Inferences
- Deduction at billing, rather than at KOT, is what Restroworks states. A food-cost gap for prepared-then-voided items would be a direct design question for breadPOS, and no source addresses it.

### Gaps
- **Not verified:** how items prepared and then cancelled affect stock in any product.
- **Not verified:** production planning, closing-stock procedure and count schedules. The Restroworks pages name these only at a high level or omit them.
- **Not verified:** whether low stock auto-marks an item unavailable on POS or aggregators. Restroworks' inventory page does not say. Rista's "auto stock-out logic" is unexplained.

## Customer QR ordering: pay-first or pay-later (DotPe especially)

### Takeaway
Available evidence leans pay-first for both DotPe (2020 press) and Restroworks (current page). Neither source confirms exclusivity. **A DotPe pay-later flow could not be verified either way.**

### Cited Findings

**DotPe**
- 2020 flow: scan a QR code to get the menu, then "select items, add to cart and pay via credit card, debit card, net banking or UPI". The article does not separately state timing or say dine-in — [Outlook Business, 31 July 2020](https://www.outlookbusiness.com/feature/with-nrais-blessing-this-fintech-start-up-is-dreaming-big-should-restaurant-aggregators-be-worried-5964) [third-party].
- McDonald's India (North and East) deployment used Scan-Order-Pay — [Entrepreneur India, excerpt only](https://www.entrepreneur.com/en-in/news-and-trends/dotpe-collaborates-with-mcdonalds-india-north-east-to/354700) [third-party].
- Current: "Diners scan, chat their way from menu discovery to payment, and reorder in two taps". Payment timing is not stated — [DotPe](https://dotpe.in/landing.html) [marketing]. The QR section on another page does not specify timing either — [dotpe.in](https://www.dotpe.in/) [marketing].
- Staff involvement: the waiter app offers "Accept/Reject orders" and "payment notifications, bill approval" — [App Store](https://apps.apple.com/us/app/-/id6755459993) [marketing]. This fits an order that staff can review, but the listing does not say whether payment precedes or follows.
- POS integration: a competitor's guide classifies "DotPe's Rista POS" as POS-integrated QR ordering, where orders appear on the waiter's POS screen — [Petpooja blog, competitor](https://blog.petpooja.com/industry-business-guides/choose-qr-ordering-system-restaurant/) [third-party].

**Restroworks (RestroScan)**
- "Guests scan, order, and pay to get their orders" — [QR ordering](https://www.restroworks.com/qr-code-ordering-system/) [marketing]. Before-or-after-meal timing is not explicitly stated.
- Orders flow automatically: "As soon as an order is placed, it appears in your POS and reaches the kitchen". Staff confirmation is not stated. Each table or room has its own QR, and tickets carry the location — [QR ordering](https://www.restroworks.com/qr-code-ordering-system/) [marketing].
- Guests pay by card, wallet or cash, or share a payment QR so someone else can settle. Listing cash suggests not every order is strictly prepaid online, but the settlement flow is not shown — [QR ordering](https://www.restroworks.com/qr-code-ordering-system/) [marketing].
- Group ordering: "Everyone at the table adds their order to the host link", and the kitchen gets one combined order — [QR ordering](https://www.restroworks.com/qr-code-ordering-system/) [marketing].
- Takeaway: staff scan a barcode at handover to verify the order — [QR ordering](https://www.restroworks.com/qr-code-ordering-system/) [marketing].

**Rista**
- QR-code ordering is listed without a flow — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing].

### Inferences
- The two products suggest a design axis worth separating: payment timing, and whether staff must accept an order before it reaches the kitchen. Sources show these as separate signals, but neither vendor documents the combinations.

### Gaps
- **Not verified:** DotPe pay-later, running tabs, and add-on rounds after first payment. A demo or merchant confirmation is needed.
- **Not verified for any vendor:** what happens when a QR order hits an unavailable item, a failed UPI payment, or a table with an open captain order.
- LimeTray: no dine-in QR flow was found. Its pages cover the restaurant's own online ordering website and app — [LimeTray](https://limetray.com/) [marketing].

## Aggregator handling and menu sync (UrbanPiper especially): order accept, reject, ready flows

### Takeaway
UrbanPiper's docs provide a state machine that can be used directly as a reference: forward-only statuses, acknowledge-before-ready, aggregator-specific cancellation limits, and asynchronous stock and store toggles. Menus go through push, validation and an Atlas publish step.

### Cited Findings

**Operator flow in UrbanPiper Prime** — [Order Tracker](https://help.urbanpiper.com/store-manager/prime-app-version/manage-orders-on-order-tracker), [Prime web](https://help.urbanpiper.com/store-manager/prime-web-version/introduction) [docs]
1. New order arrives in the **New** tab (Online Orders > Live Orders on web). Staff review items, taxes, discounts, charges, order type, platform and customer name.
2. **Accept** happens manually or automatically according to settings. The order moves to **In Progress**, and a KOT prints.
3. The kitchen prepares the food. **Food Ready** is marked by hand or automatically.
4. The order moves to **Awaiting Pickup**. The web page calls this "Waiting for Pickup", so the docs differ on the label.
5. It moves to **Dispatched** when the rider picks up.
6. It moves to **Completed** when delivered. A **Cancelled** tab lists the day's cancelled orders.

**Other Prime controls**
- Pause or resume a store on specific platforms "without calling support", per platform for the same store — [Prime app](https://help.urbanpiper.com/store-manager/prime-app) [docs].
- Auto-print and notifications are configurable — [Prime app](https://help.urbanpiper.com/store-manager/prime-app) [docs].

**API state machine** — [Order Status Update API](https://api-docs.urbanpiper.com/downstream/api/endpoints/order-management/order-status-update.md) [docs]
- Endpoint: `PUT /external/api/v1/orders/:id/status/`.
- Rank order: Placed → Acknowledged → Confirmed → Food Ready → Dispatched → Completed → Cancelled. *Confirmed* appears in the rules but not in the expected `new_status` values.
- Forward only: an earlier status returns 400 `err_order_already_in_status`. Resending the current status succeeds without re-relaying.
- Ack required: Confirmed and Food Ready need Acknowledged first (`err_order_missing_ack`). Dispatched and Completed can be sent directly from Placed.
- Completion: for aggregator-delivered orders of Indian businesses, only the aggregator can mark Completed. This does not apply to self-delivery or pickup.
- Auto-ready: Food Ready is rejected with "Order state updated ignored." when the store auto-marks ready at the set prep time.
- Dispatch: `rider_name` and `rider_phone` are required for self-delivered orders. The sample cURL uses `rider_phone_number`, which conflicts with the table.
- Webhook-only status: `customer_cancelled`, for Zomato customer cancellation requests.
- Sync is two-way: the POS pushes status by API, and changes elsewhere come back by webhook. The aggregator may cancel if acceptance is not passed within a period, whose length is not stated — [Status guide](https://api-docs.urbanpiper.com/downstream/order/order-status-update) [docs].

**Reject/cancel rules** — [Order Status Update API](https://api-docs.urbanpiper.com/downstream/api/endpoints/order-management/order-status-update.md) [docs]
- Reason codes: `item_out_of_stock`, `store_closed`, `store_busy`, `rider_not_available`, `out_of_delivery_radius`, `connectivity_issue`, `total_mismatch`, `invalid_item`, `option_out_of_stock`, `invalid_option`, `special_instructions`, `unspecified`.
- Windows: aggregator-delivered until Confirmed. Self-delivery any time before Completed. Zomato merchant-delivered until Completed. Zomato-delivered until Food Ready. The general and Zomato-delivered rules differ, and the docs do not reconcile them beyond the platform-specific entry.
- Swiggy: direct cancellation needs `can_reject_order` true in the relay and `swiggy_direct_cancellation` true with a reason. Otherwise the response is 400 "Callback requested instead", and the docs say not to retry.
- Zomato: a disallowed cancellation also falls back to a callback.
- Out-of-stock cancellation: `extra.unavailable.item_ref_ids`, plus `turn_on_at` (epoch ms), required for certain reason codes on Swiggy and Zomato.
- Older note: Swiggy merchants could cancel until Food Ready — [October 2023 update, excerpt only](https://www.urbanpiper.com/blog/october-2023-product-updates-whats-new-in-our-restaurant-tech-platform) [marketing].

**Swiggy partial out-of-stock** — [Mark Order Item Stock-out](https://api-docs.urbanpiper.com/downstream/api/endpoints/miscellaneous/mark-order-item-stock-out.md) [docs]
1. The POS posts order ID, `allow_edit` and out-of-stock items to `/hub/api/v1/orders/items-oos/` before Food Ready.
2. If `allow_edit` is false, the order is cancelled immediately.
3. If `allow_edit` is true, the customer's masked number and a PIN are retrieved so the restaurant can call the customer.
4. A webhook returns the result with the same `reference_id`.

**Rider and prep time**
- Rider statuses: `unassigned`, `assigned`, `re-assigned`, `at-store`, `out-for-delivery`, `delivered`, `additional-rider`, plus Swiggy-only `return-start`, `return-failed`, `return-completed` — [Rider Status Update](https://api-docs.urbanpiper.com/downstream/api/endpoints/order-management/rider-status-update.md) [docs].
- Prep time: the Update Order Prep Time endpoint supports only Uber Eats, Talabat, Careem and foodora, so no Indian aggregator is listed. Elsewhere, when `prep_time.adjustable` is true, prep time is sent as `extra.prep_time_mins` at acknowledgement — [Update Prep Time](https://api-docs.urbanpiper.com/downstream/api/endpoints/order-management/update-order-prep-time.md) [docs].

**Menu sync** — [Validation and Publish](https://api-docs.urbanpiper.com/downstream/menu/validation-and-publish.md) [docs]
1. The integrating system pushes the menu and confirms processing via callback.
2. The store must be mapped to aggregators.
3. A validation engine in Atlas reports errors per aggregator, and these must be fixed before publishing.
4. A user logs into Atlas, selects the store and aggregator, and publishes.

Related: with a live POS integration, Atlas > Menu Management > Menus > Import Menu brings POS changes in for publishing — [Help PDF export](https://help.urbanpiper.com/~gitbook/pdf) [docs]. Charges need a publish to reflect on Zomato — [Help PDF export](https://help.urbanpiper.com/~gitbook/pdf) [docs].

**Store toggle**
- Temporarily closing a store during overload or operational issues is relayed only to aggregators that support it, asynchronously via callback — [Store availability](https://api-docs.urbanpiper.com/downstream/availability/store.md) [docs].

**How a POS exposes this (Odoo example)**
- New → Accept → **Ongoing** (moves to the kitchen display if enabled) → Mark as Ready → **Done**. Reject opens a pop-up with cancellation options. Some platforms, such as Swiggy, need support approval. No dispatch step is shown — [UrbanPiper blog](https://www.urbanpiper.com/blog/how-to-set-up-odoo-delivery-integrations-with-urbanpiper-a-step-by-step-guide) [marketing].

**Others**
- Restroworks: "Never lose any delivery order with auto-accept feature" and a claimed 99.99% acceptance rate. Manual accept and reject are not described — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing].
- Rista: two-way integration for orders, menu, inventory and deals, with price changes, out-of-stock marking and time-based availability — [Razorpay app store](https://razorpay.com/app-store/rista) [marketing].
- DotPe: its Swiggy and Zomato service recommends menu, pricing, discount and ad changes and works inside the restaurant's own accounts under a signed authorisation. It says "Dotpe is not affiliated with either platform". This is a different model from an order-sync middleware — [DotPe](https://dotpe.in/landing.html) [marketing].
- LimeTray: "Cloud-based POS solution with integrated online & third-party orders" — [LimeTray](https://limetray.com/) [marketing].

### Inferences
- The UrbanPiper rules imply a POS should treat "cancel" as a request that may fail or become a callback, not as a guaranteed local state.
- The stock toggle's async, per-platform callbacks imply that an item can be partly synced at a given moment. A POS would need to represent that, but no source shows such a UI.

### Gaps
- The length of the acceptance timeout per aggregator is not documented. It is deferred to the aggregator.
- The Prime manual reject and cancel steps were not found. The Order Tracker page covers the Cancelled tab only.
- The UrbanPiper help PDF export stopped at 100 of 140 pages, and the Atlas publish click path was not read.
- Direct Zomato and Swiggy partner UIs were not reviewed, as they are outside this assignment.

## GST invoicing, loyalty and offline behaviour

### Takeaway
All POS vendors claim offline operation, but only Restroworks gives any scope detail. Loyalty capture is best shown by Restroworks. **GST invoicing and e-invoicing flows were not found for any vendor.**

### Cited Findings

**GST**
- Restroworks: POS page has no GST or e-invoice content in the portion read — [POS](https://www.restroworks.com/restaurant-pos-system/) [marketing]. The only related item found is a testimonial mentioning audits and GST filing — [Bakery comparison, excerpt only](https://www.restroworks.com/compare/restroworks-vs-toast-pos/for-bakeries/) [marketing].
- Rista: "itemized bills with taxes" (paraphrased from listing), with no GST specifics — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing].
- DotPe: GST is not mentioned — [DotPe](https://dotpe.in/landing.html) [marketing].
- UrbanPiper: a [Taxes](https://api-docs.urbanpiper.com/downstream/menu/taxes.md) menu doc exists, listed in the [docs index](https://api-docs.urbanpiper.com/downstream/llms.txt), but was **not read**.

**Loyalty**
- Restroworks: phone number at the counter display, points on approval, and redemption shown as a discount — [Customer display](https://www.restroworks.com/customer-order-display/), [FOH](https://www.restroworks.com/front-of-house-software/) [marketing]. Existing loyalty programmes can be integrated — [FOH](https://www.restroworks.com/front-of-house-software/) [marketing].
- DotPe: "Every bill builds a customer profile and earns loyalty points automatically". Auto-segments by spend, frequency, items and locality, with WhatsApp offers to lapsed and high-spend diners — [DotPe](https://dotpe.in/landing.html) [marketing].
- Rista: loyalty programmes, campaigns and customer analytics are listed — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing].
- LimeTray: a CRM for automated campaigns — [LimeTray](https://limetray.com/) [marketing]. A loyalty programme is listed — [Capterra, excerpt only](https://www.capterra.com/p/161232/POINT-by-LimeTray/) [third-party].

**Offline**
- Restroworks duration: "The counter keeps taking orders and payments offline for 48 hours" (up to 48 hours in the FAQ) — [Cafe](https://www.restroworks.com/cafe-management-system/) [marketing]. A customer quote on a comparison page also mentions 48 hours — [PAR Brink comparison, excerpt only](https://www.restroworks.com/compare/par-brink-vs-restroworks/) [marketing].
- Restroworks handheld: orders, courses and settlements work offline — [Fine dining](https://www.restroworks.com/fine-dine-restaurant-software/) [marketing]. Orders continue to route to the kitchen, syncing automatically on reconnect — [Tablet ordering](https://www.restroworks.com/restaurant-tablet-ordering-system/) [marketing].
- Restroworks KDS: in-house orders continue. Online and delivery orders show "Waiting to sync". The FAQ says the POS-to-kitchen link is "never affected by a connection issue" — [KDS](https://www.restroworks.com/kitchen-display-system/) [marketing]. That absolute claim is unverified.
- Rista: "Works offline for days when your Internet connection is down with auto sync when online" — [store text via AppGoblin](https://appgoblin.info/apps/com.ristaapps.business) [marketing]. "functions flawlessly offline" — [App Store](https://apps.apple.com/us/app/-/id6572293587) [marketing]. Functions and queueing are not described.
- LimeTray: "your restaurant POS software will always be up & running even if there is no internet" — [LimeTray POS](https://limetray.com/restaurant-pos) [marketing].
- DotPe: offline is not mentioned on the landing page — [DotPe](https://dotpe.in/landing.html) [marketing]. The waiter app's "offline orders" wording is ambiguous — [App Store](https://apps.apple.com/us/app/-/id6755459993) [marketing].

### Inferences
- Restroworks' KDS note implies in-house orders use a path that does not depend on the internet, while online channels do. The mechanism (local server or peer-to-peer) is not stated.

### Gaps
- **Not verified for any vendor:** GST invoice layout, CGST/SGST handling, invoice number series, e-invoice (IRN) generation, and credit notes for cancelled bills. Vendor confirmation or a demo is needed.
- **Not verified for any vendor:** how UPI or card payments work when offline, how conflicts resolve at sync, and how offline invoice numbers are assigned.
- Reviews on Capterra and TrustRadius returned 403, so independent evidence for offline reliability could not be gathered.
- Full G2, Capterra and Google Play reviews were not read for any of the vendors, so real-world complaints are under-represented in these notes.
