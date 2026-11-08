# Petpooja: concrete user flows by role (research for breadPOS)

**How to read these notes (researched 2026-11-05)**

Labels:
- **[docs]**: the vendor's own instructional material. In practice this means the official "Petpooja Tutorials" YouTube channel, plus vendor-written App Store release notes.
- **[marketing]**: the Petpooja website and blog. The blog is vendor content that mixes product claims with generic advice. Only statements tied to the product are used here.
- **[third-party]**: resellers, independent YouTubers and review sites.

Limits on the evidence:
- **No written help centre was read.** `support.petpooja.com` returned 403 and `help.petpooja.com` returned 404. Both hostnames were guesses, so this does not prove no help centre exists. The vendor's public "resource base" is a Notion page ([link](https://swayamthakkarpetpooja.notion.site/Petpooja-Tutorials-Resources-81226ddb4c394780ba89aa5b4e421468)). It returned no readable content, so its PDFs and configuration tables were not seen.
- **Videos were read as transcripts, not watched.** Most captions are auto-generated. Hindi and Bengali transcripts are my own reading, and many terms are garbled (for example, "KOT" comes out as "security" or "QT" in Hindi). Button positions and icons are only known where the speaker names them.
- **Web page details came through a summarising fetch tool.** Quotes from web pages may not be word for word. Items marked "(search summary)" come from a search result summary, and the page itself was not opened.
- **Third-party walkthroughs date from 2023-2025.** Screens and paths may have changed since.
- **Video coverage is incomplete.** The vidIQ transcript credits ran out mid-research. Some relevant videos are listed in the Gaps sections with their URLs for follow-up, and these were not read.

Petpooja's surfaces, as used throughout these notes:
- **POS / POSS**: the billing app. Runs on Windows, macOS, Linux and Android ([POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)).
- **Owner's Dashboard**: cloud admin on the web, with the mobile "Merchant app" ([Owner's Dashboard tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)).
- **Add-ons**: Captain App, KDS, Scan & Order, Waiter Calling Device and others, bought through the Marketplace.

---

## Captain/waiter: tables, orders and KOTs, transfer and merge, bill request

### Takeaway
The Captain App is a phone or tablet client of the outlet's POS, and captain rights are set per user from the dashboard. Taking an order and sending a KOT are documented. Move table has a third-party step-by-step on the POS. Table merge is only claimed in marketing, and I found no steps for it.

### Cited Findings

**Setup and login**
- Owner creates the user: Dashboard > User Management > Biller app, then Add. Fields are name, user type (biller, captain, steward, delivery boy), username, user code, password, phone and user passcode, followed by a "Captain Rights" checklist. — [third-party, Hindi, 2024](https://www.youtube.com/watch?v=A4eY7Jes6Yw)
- The rights the speaker names include item/KOT edit, generate KOT, move table, cancel KOT, generate bill and take payment. This is my reading of garbled auto-captions, and the speaker says there are others. — [third-party, 2024](https://www.youtube.com/watch?v=A4eY7Jes6Yw)
- Device login sequence: install the app, enter the outlet sync code, enter username and password, select the server IP. The same tables as the POS then appear. If the device can't connect, use "Find Server IP". After adding a dish or other data, run "Sync Data" from the side menu so it reaches the app. — [third-party, 2024](https://www.youtube.com/watch?v=A4eY7Jes6Yw)
- That video says the app works on the company Wi-Fi and not on mobile data. — [third-party, 2024](https://www.youtube.com/watch?v=A4eY7Jes6Yw)
- Each outlet can have several billing stations, but only one master billing station, which also acts as the local server for the other software. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)
- Captain App availability: runs on any Android phone or tablet and connects to the POS. — [Captain App tutorial, docs, Apr 2026](https://www.youtube.com/watch?v=pe61ZTYphnM). An iPad build also exists. — [App Store listing](https://apps.apple.com/app/id6470435905). One vendor page says it works only with Electron and Local POS. — [marketing, search summary](https://www.petpooja.com/captain-ordering-app)

**Viewing and opening tables**
- The POS shows tables grouped by area (for example ground floor, basement, party hall). Each table card shows start time, item count and amount, so staff don't need to open the table. — [third-party demo, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Table status colours: green = empty; blue = running; yellow = KOT printed, order being prepared; pink = paid but food still being cooked; a further state = final bill printed, usually for takeaway and pickup. The caption says "green" for this last state as well, which is probably a caption error. — [Order Assigning tutorial, docs, Apr 2026](https://www.youtube.com/watch?v=0THG1AG7UCM)
- The demo instead calls a yellow table "order running" after KOT. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Captain App has a "color-coded table view like the POS" and shows customer names on the table screen. — [App Store release notes 13.2.0 and 13.0.0, docs](https://apps.apple.com/app/id6470435905)
- Selecting a table opens the billing screen. The table number is prefilled and can be changed. Order type (dine-in, delivery, pickup) is at the top right, and item search at the top left. Customer details are optional on dine-in but compulsory for delivery and pickup. Covers (number of persons) and order-wise comments can be added. — [Order To Table tutorial, docs](https://www.youtube.com/watch?v=nlKZSznM6H0)
- Captains can be assigned to specific tables and areas through the POS. No steps are given. — [marketing](https://www.petpooja.com/captain-ordering-app)
- "Assign To" assigns an order to a captain, waiter or delivery person. It defaults to the logged-in biller, and only works if the owner has created additional roles in backend settings. — [Order Assigning tutorial, docs](https://www.youtube.com/watch?v=0THG1AG7UCM)

**Taking an order and sending the KOT**
1. Captain punches items. Four item-entry methods exist on the POS: favourites grid, category browse, short code (one numeric and one alphabetic per item), and search. — [third-party demo, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
2. Variation and add-on groups enforce minimum and maximum selections. The demo shows save being blocked until the required number is chosen. — [third-party demo, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
3. Tapping an item's name allows an item-level note; order-level comments are separate. — [Bill & KOT tutorial, docs](https://www.youtube.com/watch?v=VfziggfQZYI). Captain App also has order-wise and KOT-wise comments. — [release notes 13.2.0, docs](https://apps.apple.com/app/id6470435905)
4. AI recommendations suggest related items in the cart. The captain can confirm the order with the customer before sending it. — [Captain App tutorial, docs](https://www.youtube.com/watch?v=pe61ZTYphnM)
5. The order is sent with one of two buttons: **KOT** sends it digitally, and **KOT & Print** also prints a physical KOT. — [Bill & KOT tutorial, docs](https://www.youtube.com/watch?v=VfziggfQZYI)
6. Later rounds: re-open the same table, add items and send another KOT. They accumulate on one running order. — [third-party demo, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)

Related captain behaviour:
- The app can hold a full order in a "wishlist" and fire tickets course by course, with mains held until starters clear. — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/)
- On the POS, "Hold Order" pauses an order, for example between starters and mains. — [Order Assigning tutorial, docs](https://www.youtube.com/watch?v=0THG1AG7UCM)
- A captain can change a fired KOT from the device. The change reaches the kitchen with a modification tag and is logged with what changed, who changed it and when. — [marketing](https://blog.petpooja.com/industry-business-guides/petpooja-captain-ordering-reduces-order-errors/)
- Failed KOTs auto-sync when connectivity returns. — [App Store release notes, 2024, docs](https://apps.apple.com/app/id6470435905)

**Transfer and merge**
- Move table on the POS, method 1: click the table card's eye/view icon, change the table number on the order, then save (the speaker uses F6 or a KOT-only save). — [third-party, Hindi, 2023](https://www.youtube.com/watch?v=y1v8HsOa2UM)
- Move table on the POS, method 2: click the "Table" move control at the top (it turns green), click the source table, pick the destination from a list that excludes the source, then OK. — [third-party, Hindi, 2023](https://www.youtube.com/watch?v=y1v8HsOa2UM)
- A setting can print a new KOT with the new table number when KOT items are moved between tables. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- A whole table or a single ticket can move. The move is logged in KOT history and shown in the leakage panel. — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/)
- Merge: the only claim is "merge, move, or split tables on the fly". — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/)

**Bill request and payment at the table**
- Waiter Calling Device: a four-button table unit (Water, Waiter, Bill, Cancel). A press alerts the POS, the Captain App and a staff-station screen. — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/)
- At billing, the captain can accept digital payment or settle in cash. — [Captain App tutorial, docs](https://www.youtube.com/watch?v=pe61ZTYphnM)
- The app also lists UPI, wallet and single-tap contactless card under INR 5,000. — [marketing](https://www.petpooja.com/captain-ordering-app)
- A printer can be flagged to print only bills punched by captains. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0). Table and KOT numbers appear on Bluetooth captain printouts. — [release notes 13.2.0, docs](https://apps.apple.com/app/id6470435905)
- Newer app flows: Zomato dine-in QR order acceptance and table reservation orders. — [release notes 13.6.1, Dec 2025, docs](https://apps.apple.com/app/id6470435905)
- Captain Performance Report ("Report #82") shows sales per captain. — [marketing](https://blog.petpooja.com/industry-business-guides/petpooja-captain-ordering-reduces-order-errors/)

### Inferences
- Rights such as move table, cancel KOT, generate bill and take payment look like per-user toggles rather than fixed roles, so a captain can be allowed to settle or not. This rests on one third-party video.
- The Wi-Fi requirement alongside the "works without internet" claim suggests the app needs LAN access to the master POS rather than the internet. No source states this directly.

### Gaps
- **Merge table steps** on POS or Captain App: not verified. No source shows them.
- **Move table on the Captain App:** only the right is shown, not the steps.
- **Vendor's captain walkthrough:** the tutorial is a 1-minute overview. The longer walkthroughs were not read: [Telugu 11-min, vendor trainer](https://www.youtube.com/watch?v=MC6pmNuKZFI) and [reseller 4:51 demo, no captions](https://www.youtube.com/watch?v=P8pYx17aBxE).
- **Concurrency:** what happens when two captains edit one table. Not found.
- **Captain table lock or area restriction:** the configuration is not shown.

---

## Kitchen: KOT routing to printers or KDS, ready and sold-out

### Takeaway
KOT routing is the best-documented flow found. Each printer gets its own assignment by category, item, table, order type, POS station or cloud-kitchen brand. KDS marks food ready and items unavailable, but its station setup is not documented in anything I read.

### Cited Findings

**Printer routing setup** — all from the [21-min Printer Management tutorial, docs, 2024](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Per-printer path: POS left menu > Operations > Bill/KOT Print > Multiple Printer Settings. This lists printers, each with an edit control and an Assign button.
- Per-printer fields: name, connected printer, printer type, "Captain bill print" checkbox, "report print" checkbox, bill print format and KOT print format.
- KOT assignment: categories (all or selected), then items within those categories, then order type.
- Bill assignment: order types and copy counts, plus all or selected tables.
- Routing dimensions:
  - Table number, for bills and KOTs, to limit waiter walking.
  - Category, KOT only. For example, desserts go to the cold kitchen and beverages to the bar.
  - Item, KOT only.
  - POS station, so a given billing station uses its own printer.
  - Order type (dine-in, delivery, takeaway, online, aggregator).
  - Cloud-kitchen brand.
- "Print clone": any number of copies, with no cap stated.
- Connectivity: Bluetooth, USB, LAN and Wi-Fi. Technology: dot matrix, laser, inkjet and thermal.

**KOT print settings** — Owner's Dashboard > Configurations > Outlet Configuration > Print ([same tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0))
- Print KOT when the bill is printed.
- Print only modified KOT: a new KOT prints with the changes.
- Print only modified items in the KOT.
- Print cancelled KOT, when a whole KOT is cancelled.
- Print deleted items in KOT, when a single item is deleted from a running KOT.
- Print deleted items in a separate KOT.
- Print add-ons and special notes below the item row.
- Show "duplicate" on reprinted KOTs.
- Print KOT number on the bill as a token number.
- Show a barcode on bill or KOT to mark food ready and for Swiggy delivery pickup (requires the Swiggy integration). The staff member scans it to mark food ready and to hand over to the rider.

**KDS** — [KDS tutorial, docs, Apr 2026](https://www.youtube.com/watch?v=nhAVcwIwWJM)
- Touchscreen, Windows-based.
- When an order is punched, a KOT is created and displayed on the KDS with variations and add-ons. This removes the need for printed KOTs.
- One button marks food ready for delivery or dine-in.
- Kitchen staff can mark an unavailable item directly from the KDS, and it updates on the POS.
- Prepared KOTs can be recalled. The caption says "prepaid", which is probably a caption error for "prepared".

**Other kitchen and routing behaviour**
- On confirmation, the order splits and each item routes to its station by item-to-station mapping. — [marketing](https://blog.petpooja.com/industry-business-guides/petpooja-captain-ordering-reduces-order-errors/)
- Kitchen display item priority exists. — [App Store release note 12.8.0, docs](https://apps.apple.com/app/id6470435905)
- Food can be marked ready from POS, KDS or Petpooja's app, and token management shows status on a screen for riders. — [marketing, search summary](https://www.petpooja.com/poss/online-order-token-management)
- Food Ready Reminder flags orders still open past a set time (60 minutes in the example). Food-ready tokens can print at a named station. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- The POS measures KOT process time, from KOT punched to settled. — [marketing](https://blog.petpooja.com/industry-business-guides/petpooja-captain-ordering-reduces-order-errors/)

**Sold-out** (see also the Aggregators section for durations)
- POS top bar has an "item on/off" button. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)
- Menu on/off marks an item unavailable across counter, aggregators and kiosk at once. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)

### Inferences
- A single kitchen can mix printers and KDS only if KDS routing follows similar assignments. No source confirms this, so treat it as open.

### Gaps
- **KDS station setup:** whether there are multiple KDS screens per station, bump or partial-item ready, or expeditor views. Not verified.
- **Printer failure:** whether a KOT is queued, fails over to another printer or alerts staff. Not found, except "auto-sync of failed KOTs" in the app release notes.
- **Hardware limits and KDS on Android:** the tutorial says Windows only. Not cross-checked.
- **Captain or waiter notification when food is ready** (dine-in): not found.

---

## Cashier: billing, split, merge, discount, complimentary, payment modes, partial payment, reprint

### Takeaway
The billing screen has three bill actions and a settlement screen with Cash, Card, Due, Other and Part tenders. Split has percentage and item-wise modes. Discounts have many preset types with per-user limits. Merging two bills is not documented anywhere I found.

### Cited Findings

**Login and screen**
- POS first run: choose keyboard or touch mode, enter the sync code, name the station, and log in by username/password, passcode, or swipe access card. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)
- Top bar: new order, bill number lookup, item on/off, store status, live view, online orders, recent orders, hold orders, notifications, aggregators, help centre, logout. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)
- The left menu has Operations, Reports and Settings. It shows only the modules and reports the user was granted. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)

**Bill actions** — [Bill & KOT tutorial, docs](https://www.youtube.com/watch?v=VfziggfQZYI)
- **Save** records the order as served or completed.
- **Save & Print** does the same and prints a bill.
- **Save & e-Bill** sends a digital bill to the customer's mobile number.
- An upward arrow at the bottom of the billing area expands a breakdown of subtotal, tax, tips, discount and grand total.

**Typical dine-in close** — [third-party demo, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
1. Customer asks for the bill. Cashier clicks the table's eye icon to review items.
2. Quantity can be changed or items removed here. The speaker saves with a reason (partly inaudible in captions).
3. Print the bill. The table colour changes.
4. Settle from the order or from the table card, without opening the order.

**Settlement screen** — [Settlement Types tutorial, docs](https://www.youtube.com/watch?v=Z_HS4eu4ibw)
- Shows payment mode, total, change due, tips and final amount.
- "It's Paid" is used when the customer has already paid in advance. Extra money can be settled at final settlement.

**Payment modes** — [Types Of Payment tutorial, docs](https://www.youtube.com/watch?v=lTWIwcqRGyM)
- Cash; Card; **Due** (customer pays later, marked as credit); **Other** (third-party apps or bank transfer); **More** (all available methods); **Part** (multiple methods on one bill).

**Tender details from the reseller demo** — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- **Cash:** enter the amount received, and the change is shown. An underpayment the cashier accepts (₹353 settled at ₹350 in the example) sends the difference to "waived off".
- **Due:** requires a customer number. The amount adds to that customer's running due balance.
- **Part:** add tender lines (₹115 on Paytm plus ₹100 by a second mode, captioned unclearly). Lines can be removed with a cross.
- **Changing tender:** a printed bill marked Card can be switched to Other > UPI/Google Pay/PhonePe before settling.

**UPI**
- As a tender tag, UPI sits under Other. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- With a payment integration, card, UPI and wallet link to the POS bill and the POS "marks that bill settled without a manual tick". No provider is named. — [marketing](https://blog.petpooja.com/operations-workflows/must-have-integrations-for-managing-your-restaurant/)
- Petpooja Pay is an Android payment app taking cash, card and QR. — [marketing, search summary](https://petpooja.com/petpooja-pay)
- Settlement rule: "A bill cannot be settled while any amount is still marked 'Not Paid'". Each rupee must go to Cash, Card, UPI or Credit. — [marketing](https://blog.petpooja.com/finance-compliance/restaurant-day-end-report-how-close-and-reconcile/)

**Split bill**
- Two options: percentage/portion (equal or a chosen percentage) and item-wise (assign items to a customer, creating separate bills). — [Types Of Payment tutorial, docs](https://www.youtube.com/watch?v=lTWIwcqRGyM)
- Demo: 1/10 split auto-divides the bill and prints 10 equal bills in sequence. Each is settled individually. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Descriptions conflict. The tutorial lists two modes. A blog lists three: percentage, price and proportion. — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/). A glossary lists equal, item-wise and custom amount, with GST recalculated per share. — [marketing, search summary](https://blog.petpooja.com/glossary/split-bill/)
- After a split the kitchen still sees one set of tickets. — [marketing](https://blog.petpooja.com/industry-business-guides/fine-dine-pos-what-handle-on-busy-floor/)

**Discounts**
- Billing > More > discount. A biller can apply discounts only if the owner gave permission, up to a set limit per user login. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Types shown: percentage, fixed amount, category-wise, item-wise, coupon code, happy hour, buy-X-get-Y, and customer tag discounts (for example "school" 20%, "friends" 12% applied automatically on entering the customer's number). — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- BOGO button applies active offers. These must be created on the Owner's Dashboard to appear in billing. — [Types Of Payment tutorial, docs](https://www.youtube.com/watch?v=lTWIwcqRGyM)

**Complimentary and sales return**
- Complimentary bill: order given free, with no payment processed. Sales return: customer returns an order, for example because it was undercooked. — [Types Of Payment tutorial, docs](https://www.youtube.com/watch?v=lTWIwcqRGyM)
- Complimentary is also used for family or staff consumption so inventory still tracks. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- "The drawer stays shut when a complimentary order is punched". — [marketing](https://blog.petpooja.com/finance-compliance/restaurant-day-end-report-how-close-and-reconcile/)

**Reprint**
- Settings: "Show duplicate" on reprinted bills, and "Save invoice print history" to log reprints. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Reprint appears next to View and Cancel on the Dashboard order record. — [third-party, Hindi, 2023](https://www.youtube.com/watch?v=2FGgvbIIERE)
- Reprints surface in the dashboard's leakage points. — [Owner's Dashboard tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)

**Other billing features**
- Open items: on-the-fly item names and prices (for example decoration, a cake) and open-price items (for example a water bottle at MRP). — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Advance orders: schedule for a future date and time, with payment mode and notes. — [Order Assigning tutorial, docs](https://www.youtube.com/watch?v=0THG1AG7UCM)
- Live View gives an overview of KOT, delivery, takeaway and bill-paid states. — [Order Assigning tutorial, docs](https://www.youtube.com/watch?v=0THG1AG7UCM)
- Takeaway/QSR: punch items, then save and print. The bill and KOT come out together. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- Customer panel: email, birthday, anniversary, tag, visit history, GSTIN and mark favourite. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)

### Inferences
- "Partial payment" has two possible meanings. Multi-tender (Part) is well supported. Pay some now and the rest later would rely on Due or It's Paid, but no source shows them combined on one bill.

### Gaps
- **Bill merge** (combining two bills into one): not verified. Only table merge is mentioned, in marketing.
- **Part + Due on one bill:** not verified.
- **Complimentary reason or approval:** not verified. An unread third-party walkthrough exists: [NC sale entry](https://www.youtube.com/watch?v=5evEr-LbZMc).
- **Sales return steps:** the document produced and its GST treatment (credit note?) on POSS are not verified.
- **Reprint from the POS:** the exact path is not shown. Reprint permission is not shown either.
- **Integrated UPI QR flow on the billing screen:** the screen and timeout/failure handling are not shown.
- **Tip handling:** the field appears, but how tips are recorded or reported was not found.

---

## Manager/owner: void and cancel approvals, permissions, day and shift close, reports

### Takeaway
The dashboard's leakage panel and per-user rights are confirmed. Approval evidence is thin: a third-party video shows bill cancel on the dashboard needing the owner's dashboard password plus a typed reason. I found no vendor documentation of an approval workflow, and the only cash-drawer shift or day-close material describes generic practice.

### Cited Findings

**Bill cancel**
- Path: Owner's Dashboard > Operations > Orders > select the order, which offers View, Reprint and Cancel. Clicking Cancel asks for the owner's dashboard password and a cancel reason (typed "by mistake" in the demo), then Submit. — [third-party, Hindi, 2023](https://www.youtube.com/watch?v=2FGgvbIIERE)

**KOT and item cancel**
- When a server cancels an item, POSS asks for a reason and pulls the item back from the correct station. Each cancellation is filed with time and person, and managers can pull a cancellation report for a shift or outlet. — [marketing](https://blog.petpooja.com/glossary/kot-cancellation/)
- The same page presents waiter-raises and manager-approves as standard practice that varies by outlet rights. It does not describe this as a Petpooja workflow. — [marketing](https://blog.petpooja.com/glossary/kot-cancellation/)
- Printing the cancelled KOT or deleted items tells the kitchen. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Void rules on the void-bill glossary (bill number stays consumed, value reads zero, supervisor-only logins, credit note after the window) are generic and not stated as Petpooja behaviour. — [marketing](https://blog.petpooja.com/glossary/void-bill/)

**Permissions**
- Access to modules and software is controlled by the owner through the dashboard. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek)
- User rights are set per staff login. They control what each person can do, which reports they can open, and whether they can change a bill after settlement. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- Consolidated reports at Owner's Dashboard > All Outlets > Reports are visible only if the admin assigned rights to the user. — [Manual Adjustment Report video description, docs](https://www.youtube.com/watch?v=eaFccK289Ys)
- User types under User Management > Biller app: biller, captain, delivery boy, order acceptor. — [third-party, 2023](https://www.youtube.com/watch?v=7L_tkN3Dh8s)
- The dashboard supports two-step authentication. — [Owner's Dashboard tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)
- Changes to online-order auto-accept are logged. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)

**Day close and shift close**
- Day End Summary is described as generating in under 5 minutes and showing sales, tenders, discounts and taxes on one screen. — [marketing](https://blog.petpooja.com/finance-compliance/restaurant-day-end-report-how-close-and-reconcile/)
- On the Android app, outlets trading past midnight can close the business day manually rather than on a fixed cycle. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- Cash denominations are tracked on a separate, unnamed accounting screen. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- POSS gives "detailed reports on bill modifications, discounted and cancelled orders and cash drawer operations". — [marketing](https://blog.petpooja.com/glossary/quick-shift-change/)
- The shift change steps on that page (stop billing, count together, hand over tables, close session, reset float) are generic practice and not stated as a Petpooja screen. — [marketing](https://blog.petpooja.com/glossary/quick-shift-change/)
- Day-end still works offline, and totals include offline bills. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)

**Dashboard and reports**
- Owner's Dashboard tiles — [tutorial, docs, 2024](https://www.youtube.com/watch?v=ReK9on1tAXc):
  - Sales and orders by order type or aggregator
  - Sales by user
  - Online payment types
  - Not-accounted sales
  - Discounts by user and type
  - Payment-mode totals
  - Expenses in four categories
  - Order stats: successful, cancelled, complimentary, table turnaround
  - Top and low sellers
  - Sync status with a resync button
  - Taxes collected
- **Leakage points tile:** bills modified, reprinted or waived off, and KOTs cancelled, modified or not converted to bills. — [same tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)
- The layout varies by outlet type. An All Outlets view exists. The same data is on the phone Merchant app. — [same tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)
- Named reports:
  - Bill Settlement Report: payment type and time per bill. — [marketing](https://blog.petpooja.com/finance-compliance/restaurant-day-end-report-how-close-and-reconcile/)
  - Item-wise sales, discount, category, Sales by biller, AI Restaurant Report: Day Wise, Dynamic Reports. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
  - Cover size summary. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
  - Marketing cites 80+ reports. — [marketing](https://blog.petpooja.com/glossary/void-bill/)
- The Android POS has limited reports, with filters and Excel export. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek). Most reports can be exported to Excel. — [Printer tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)

### Inferences
- The observed control pattern is detection after the fact (leakage tile, reports, duplicate stamps) plus per-user rights. An in-the-moment manager approval step is only seen in the owner's password on bill cancel, from one third-party video.

### Gaps
- **In-app manager approval or PIN override** for void or KOT cancel on the POS or Captain App: not verified.
- **Configurable reason lists:** not verified. The only demo shows a typed reason.
- **Complete rights matrix per role:** not found, and likely only visible inside the product. The vendor video "Payment Approval Flow" concerns purchase payments by its context in the inventory playlist, and was not read: [link](https://www.youtube.com/watch?v=TrJNU_NMn9k).
- **Shift close and day close screens:** I could not verify the steps, who may close or reopen, or whether a closed day blocks new bills. No vendor tutorial on these turned up in the channel listings I saw, but those listings were partial.
- **Opening float and cash-in/out entry:** only "cash drawer operations" reports are mentioned.

---

## Inventory and recipes: raw materials, purchase, recipe deduction, wastage, stock count

### Takeaway
This is the best-documented area on the vendor's channel. It runs from units to raw materials, recipes, purchase, automatic deduction, then a closing stock entry that generates variance. Most work happens on the Owner's Dashboard, not the POS.

### Cited Findings

**Lifecycle** — [Inventory Introduction tutorial, docs, 2023](https://www.youtube.com/watch?v=YwrUf0RQR-Y)
- Stages: assess need, purchase (inquiry, vendor onboarding, place order), receiving (purchase return or acceptance), settlement (payment and vendor accounting), consumption.
- Consumption has four parts:
  - **Yield:** 5 kg mango gives 3 kg pulp. The system calls this "normal loss percentage".
  - **Portioning:** pulp into 300 g boxes, called "convert raw material".
  - **Semi-finished goods:** pulp + sugar + milk becomes puree.
  - **Final consumption:** the system reduces stock per the item recipe "as soon as the order is punched and billed".
- Wastage and expiry, once entered, reduce stock.
- Physical stock vs digital (ideal) stock gives variance.

**Setup order** — [Item Recipes tutorial, docs](https://www.youtube.com/watch?v=3jFViCCtMPE)
1. Create units (kg, boxes, pallets, cartons).
2. Create the raw material "identity card": HSN code, purchase price, purchase unit, consumption unit, short code and image, plus the conversion (grams per carton).
3. Create semi-finished goods.
4. Create the item recipe. Menu items must already exist in menu management. Add ingredients and quantities, and also recipes for add-ons and variations. Recipes can be copied, edited, deleted or built on top of another.

**Stock count** — Owner's Dashboard > Inventory > Consumption > Closing Stock ([tutorial, docs, 2023](https://www.youtube.com/watch?v=7BoHRhPwYBU))
- Favourited raw materials list first. Columns: category, name, existing stock, current stock input and comment.
- Quantities must be entered per unit box (kg in one box, g in another).
- One date applies to all entries in a session, with a frequency filter (daily, bi-weekly, monthly, yearly).
- Alternative: pick specific materials only; bulk Excel download and upload; or download a PDF count sheet to fill in physically, then enter it.
- Select the correct outlet first.
- Variance cannot be generated until closing stock is entered.

**Reports and tracking**
- Opening-Closing report: Dashboard > Inventory > Reports. Search by material or category and date range. Shows quantities, average purchase price and closing stock cost. — [tutorial, docs, Hindi, 2023](https://www.youtube.com/watch?v=-OVrl7nuc_E)
- Inventory dashboard has a Daily Stock Closing Tracker and a COGS breakdown. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- Low-stock levels on raw materials, and expiry monitoring for perishables. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)

**Purchase and availability**
- Purchase orders go to a supplier or the central kitchen. Purchase Manager compares supplier prices. Purchases sync to inventory within about two hours. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- Availability by build: Electron = full; Local = offline only; Android = through a connector; Lite = none. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- User review: "Inventory management should be simplified". — [third-party, Capterra via search summary; review page itself returned 403](https://www.capterra.com/p/172163/Petpooja-Restaurant-Management-Platform/reviews/?page=2)

### Inferences
- The caption says deduction happens when an order is "punched and billed", and the closing-stock tutorial mentions "digital entries of bills". Whether deduction fires at KOT or at bill is therefore ambiguous. This matters for cancelled KOTs.

### Gaps
- **Screens that exist by title only** on the vendor's channel, not read:
  - [Wastage](https://www.youtube.com/watch?v=Z0v5oie1dio)
  - [Stock Purchase](https://www.youtube.com/watch?v=8lWbEfwWii0)
  - [Request For Purchase](https://www.youtube.com/watch?v=jKgbAAy80sE)
  - [Purchase Order Approval](https://www.youtube.com/watch?v=N5g44_DpEws)
  - [Production Entry](https://www.youtube.com/watch?v=F4I9JIKJldQ)
  - [Transfer](https://www.youtube.com/watch?v=zPx8-QMpSEw)
  - [Closing & Opening Stock Entry](https://www.youtube.com/watch?v=dkgbCfxk8A4)
  - [Raw Materials, 20-min](https://www.youtube.com/watch?v=iVekKAZ4HiM)
  - [Recipe Management, 16-min](https://www.youtube.com/watch?v=SfLskCzvd7Y)
  - [Inventory App](https://www.youtube.com/watch?v=_Fiq8oVqU8A)
- **Wastage entry steps and the purchase/GRN flow:** not verified because those videos were not read.
- **Whether a cancelled or wasted KOT returns stock:** not found.
- **Whether stock level auto-marks a menu item sold out:** not found.

---

## Customer QR ordering: scan to order, staff acceptance, payment

### Takeaway
Scan & Order is browser-based, with no app. Staff or code validation is required before a KOT fires, but sources disagree on the mechanism (captain-app PIN, customer OTP, or on-screen code). Bills default to normal POS settlement, and online payment is mentioned without any described flow.

### Cited Findings

**Customer flow**
1. Customer scans the table QR with the phone camera. The menu opens in the browser, with no app or sign-up. — [marketing](https://www.petpooja.com/scan-and-order)
2. Customer adds items, reviews the cart and places the order. — [marketing](https://www.petpooja.com/scan-and-order)
3. Order is validated, then the KOT fires. "KOT only fires after confirmation". — [marketing](https://www.petpooja.com/scan-and-order)
4. Rescanning or re-ordering on the same QR adds to the same running table bill. Different guests can order separately. — [marketing](https://www.petpooja.com/scan-and-order)

**Validation: sources conflict**
- **Dine-in table QR:** the customer enters a **PIN generated from the Captain application**. Once verified, the KOT prints, and the customer receives an SMS with the PIN and the ordering link. — [Scan & Order tutorial, docs, Apr 2026](https://www.youtube.com/watch?v=whN-Ot-vhTs)
- **Pickup and general dine-in QR:** the customer adds to cart, then verifies by **OTP**. The order is pushed directly to the POS. — [Scan & Order tutorial, docs](https://www.youtube.com/watch?v=whN-Ot-vhTs)
- The product page says the OTP is sent to the customer's phone and a captain validates it. — [marketing](https://www.petpooja.com/scan-and-order)
- A blog says a validation code appears on the diner's screen and staff check it on the POS. — [marketing](https://blog.petpooja.com/industry-business-guides/what-is-scan-and-order-qr-ordering-indian-restaurants/)

**Payment**
- The demo on the product page shows "Pay at counter" or "pay online". The online process is not described. "Scan & Pay" is listed as an add-on. — [marketing](https://www.petpooja.com/scan-and-order)
- Bills settle through the standard billing flow. Phone payment is "Possible (depends on setup)". — [marketing](https://blog.petpooja.com/industry-business-guides/what-is-scan-and-order-qr-ordering-indian-restaurants/)

**Configuration and constraints**
- QR codes are generated in the Menu module of the Admin Dashboard, unique per table. QR ordering can be switched on or off there. Sold-out items can be hidden. — [marketing](https://www.petpooja.com/scan-and-order)
- Runs on Electron and Local POS, with limited support on Lite and none on Android. — [marketing](https://blog.petpooja.com/industry-business-guides/what-is-scan-and-order-qr-ordering-indian-restaurants/)
- Needs internet on both the phone and the POS. — [marketing](https://www.petpooja.com/scan-and-order)
- A printed menu QR is also a supported document. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Separate kiosk: an order is created only after payment clears when paying at the counter. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/). Configuration tutorial not read: [link](https://www.youtube.com/watch?v=EIwinpbruio).

### Inferences
- The most authoritative source (the vendor tutorial) points to a captain-issued PIN for table QR, which gates ordering behind staff contact. The other descriptions may reflect different versions or modes. This cannot be resolved from what I read.

### Gaps
- **PIN specifics:** how the captain generates it, how long it lasts, and whether each round needs it. Not found.
- **Rejection:** whether staff can reject or edit a QR order. Not found.
- **Online pay:** when payment occurs (before KOT or at the end), and how the table closes after payment. Not verified.

---

## Aggregators: Swiggy/Zomato accept, reject, ready, menu sync

### Takeaway
Aggregator orders land in the POS with accept and reject, an order-acceptor role exists for phones, and "Food Ready" notifies the rider. Item and store toggles have defined durations and reasons. The detailed flows come from third-party walkthroughs from 2023 and need checking against the current product.

### Cited Findings

**Order flow on the POS** — [third-party walkthrough, 2023](https://www.youtube.com/watch?v=qs9WHTZYi4I)
1. Incoming order appears on the left with Accept and Reject options.
2. Accept shows delivery and preparation time, plus actions: Save, Save & Print, Save & e-Bill, KOT, KOT Print. Save & Print generates both bill and KOT.
3. Accepted orders appear under Live View > View Details: customer name, address, items, and a note icon for any customer note.
4. Rider area reads "Not assigned" until a rider is assigned, then shows name, contact number, OTP and order ID.
5. Staff tap **Food is Ready**, which messages the rider. The rider collects; dispatch and delivered states are completed by the rider, and the bill settles automatically.

**Phone acceptance** — [third-party, 2023](https://www.youtube.com/watch?v=7L_tkN3Dh8s)
- Set up in Admin > Manage > User Management > Biller app > Order Acceptor, then activate and set the login.
- The app has Pending, Accepted and Rejected tabs, and toggles items on or off for both Zomato and Swiggy.
- New orders ring on both POS and mobile.

**Item on/off** — [third-party, 2023](https://www.youtube.com/watch?v=qs9WHTZYi4I)
- POS top-bar item on/off screen has per-aggregator and All views.
- Turning an item off asks for a duration: 2, 4, 8 or 24 hours; Indefinite (described as one month); or Custom (any date and time within a week).
- The item returns on automatically after the period, or can be turned on manually.

**Store on/off** — [third-party, 2023](https://www.youtube.com/watch?v=qs9WHTZYi4I)
- Store Status shows online or offline per aggregator.
- Turning off manually requires a reason and a reopen date and time.
- The outlet also goes on and off automatically on daily timings.
- A Swiggy Partners clip on this exists but was not read: [link](https://www.youtube.com/watch?v=H3u3U5x9KUc).

**Vendor statements**
- Online-order auto-accept sets how long the acceptance window runs and when an unaccepted order cancels. — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)
- Accept, send to kitchen and mark ready are all available from one view. — [marketing](https://blog.petpooja.com/operations-workflows/must-have-integrations-for-managing-your-restaurant/)
- Scanning a barcode on the KOT or bill marks food ready and hands over to the Swiggy rider. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- A separate printer can be dedicated to aggregator orders. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Menu edits made once in the POS update on Swiggy, Zomato and own channels. The POS compiles platform-wise reconciled reports (commission, charges, taxes). — [marketing](https://www.petpooja.com/poss/online-order-management-software)
- The dashboard shows pushed menu progress per outlet ("Pushed Changes Tracking"). — [marketing](https://blog.petpooja.com/operations-workflows/must-try-features-petpooja-pos/)

### Inferences
- None beyond what is cited.

### Gaps
- **Reject:** whether a reason is required and what the options are. Not verified.
- **Menu sync:** whether it is automatic or needs a manual push, approval times and failure states. Not verified.
- **Aggregator cancellation after accept:** how the KOT is handled. Not found.
- **Prep-time adjustment:** whether staff can change it. The screen shows it, but editing was not confirmed.

---

## GST invoicing, loyalty and offline behaviour

### Takeaway
Offline is well described by the vendor, though in marketing pages: billing, KOT and day-end run for up to 5 days on most builds, but aggregators, cloud reports and menu pushes wait. GST evidence for restaurant POS flows is thin beyond print settings and an e-invoice add-on. Loyalty appears to be a marketplace add-on with OTP-protected redemption.

### Cited Findings

**GST**
- Category-wise tax breakup can print on the bill, because items can have different tax rates. — [Printer Management tutorial, docs](https://www.youtube.com/watch?v=IRv-9Ofa6F0)
- Customer GSTIN can be stored against the customer in billing. — [third-party, 2022](https://www.youtube.com/watch?v=y12pNLvkMt8)
- HSN code is a raw-material field. — [Item Recipes tutorial, docs](https://www.youtube.com/watch?v=3jFViCCtMPE)
- Dashboard shows tax collected by category and date range. — [Owner's Dashboard tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)
- E-invoicing on POSS is an add-on that generates the IRN for a bill. Aggregator orders fall under Section 9(5), where the aggregator is the supplier. — [marketing, search summary](https://blog.petpooja.com/finance-compliance/e-invoice-for-restaurants-most-bills-do-not-need/)
- E-way bills sit in the inventory module, mainly for central-kitchen transfers. — [marketing, search summary](https://blog.petpooja.com/finance-compliance/e-invoice-for-restaurants-most-bills-do-not-need/)
- Offline bills keep the same GST serial series. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)
- GSTR-1, GSTR-2 and GSTR-3B reports are marketed, but on pages that are not restaurant-specific. Credit notes are documented for Petpooja Invoice, the retail product. — [marketing, search summary](https://blog.petpooja.com/finance-compliance/petpooja-invoice-features/)

**Loyalty**
- Loyalty points are added automatically based on order value. The feature is enabled through the Marketplace. — [Types Of Payment tutorial, docs](https://www.youtube.com/watch?v=lTWIwcqRGyM)
- The POS credits points on each bill, with an SMS to the customer. For redemption, the biller enters the customer's number and an OTP is sent, so counter staff cannot drain a wallet without the customer knowing. Customers can pre-load a wallet. — [marketing, search summary](https://www.petpooja.com/poss/restaurant-loyalty-program)
- The native module has no tiers, paid memberships or referral cards. Plan availability conflicts between vendor blogs: one says Electron only on Growth or Scale plans, another says bundled at no extra cost. — [marketing, search summary](https://blog.petpooja.com/industry-business-guides/best-restaurant-loyalty-software-india/)

**Offline by build** — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)

| Build | Offline | Data location | Reconnection |
|---|---|---|---|
| POS Lite | No (cloud only) | Petpooja cloud | n/a |
| Android POS | Up to 5 days | Petpooja cloud | Syncs |
| Electron POS | Up to 5 days | Petpooja cloud | Syncs |
| POS Local | Up to 5 days | Own device | Reconnects to Bridge Server |

- **Keeps working:** billing, KOT printing, table management, cash settlement, day-end, and the saved menu. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)
- **Stops:** Swiggy and Zomato orders (described as arriving late rather than lost), EDC card payments, cloud reports and dashboard, and online menu edits and online on/off. A direct UPI QR is suggested as a fallback. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)
- **Sync:** offline bills, KOTs and settlements sync automatically with no re-entry. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)
- **Power Failure Group:** a backend-only group to switch off unservable items in one toggle during outages. — [marketing](https://blog.petpooja.com/industry-business-guides/restaurant-pos-without-internet/)
- **Local POS architecture:** a Bridge Server on the owner's machine stores bills and reports. Menu and online orders come down from Petpooja. One machine can serve up to 50 outlets. — [marketing](https://www.petpooja.com/offline-pos)
- **Captain App:** runs offline, stores orders on the device, syncs on reconnect, and is claimed to last up to 5 days. — [marketing](https://blog.petpooja.com/industry-business-guides/petpooja-captain-ordering-reduces-order-errors/)
- **Android sync:** a globe icon syncs the Android POS with the server. — [POS tutorial, docs](https://www.youtube.com/watch?v=zPwJPJmhsek). The dashboard shows last sync time with a resync action. — [Owner's Dashboard tutorial, docs](https://www.youtube.com/watch?v=ReK9on1tAXc)
- **Reliability evidence:** I found no substantial independent reports confirming or disputing sync reliability. The Captain App's App Store rating is 3.0 from 2 ratings, too few to mean anything. — [App Store](https://apps.apple.com/app/id6470435905)

### Inferences
- The Captain App's "offline" and the "Wi-Fi only" report may mean two different things (no internet vs no LAN). No source tests what happens when the master POS itself is unreachable.

### Gaps
- **GST on POSS:** invoice series setup, GSTR export formats, service charge taxation, and whether voids or sales returns generate credit notes. Not verified.
- **Offline add-ons:** whether KDS and multi-terminal billing work during internet loss. The offline-POS page does not specify. QR explicitly needs internet.
- **After 5 days:** what happens when the window lapses is not documented.
- **Offline conflict handling:** what happens if a sold-out toggle or price change collides with offline bills. Not found.
- **User reviews:** Capterra returned 403 and the Google Play package URL I tried returned 404, so reviews are largely unread. Real-world failure modes remain the weakest part of this research.
