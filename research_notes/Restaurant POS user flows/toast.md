# Toast POS: concrete user flows by role (input for breadPOS)

Researched 2026-11-05. How to read the labels:

- **[docs]**: Toast vendor page (support.toasttab.com or updates.toasttab.com) that I fetched. The fetch tool returns a summary, so UI labels are near-verbatim but should be spot-checked before being quoted as exact.
- **[docs, excerpt]**: Toast vendor page seen only as a search excerpt. **doc.toasttab.com (platform guide and developer guide) returned HTTP 403 to direct fetches**, so everything from it is excerpt-only and less certain. Treat these as leads to confirm.
- **[marketing]**: vendor promotional claim.
- **[third-party]**: not Toast.

Toast's help centre documents two UI generations (legacy and "new" Toast POS) plus limited releases, so some paths vary by account. The regions named in the pages I read are the US, Canada, UK, Ireland and Australia. None mentioned India, and I did not research Toast availability there. "Transferable" notes are my judgement, not sourced findings. India-specific points in them (UPI, GST, KOT) were not researched here.

## Server: floor plan, table and check, seats, coursing and firing, holds, transfers, order and pay at the table

### Takeaway
The server loop is: tap a table tile, build the check, then choose Send, Stay or Hold per item, and pay. Toast documents screens and buttons well but never gives an explicit "open a table" sequence. Coursing is a separate configurable layer that can fire by server, timer, previous course completion or expediter.

### Cited Findings

**Floor plan**
- The Table Service screen shows the dining room layout. Service areas sit in a top navigation bar; pan by sliding, zoom by pinch or the Zoom button. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Each tile shows guest count, table timer, table number and service area, total table spend, and server initials. Assigned tables show initials in a coloured badge and a border in that server's colour. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Assigning servers: tap the server assignment button (top right), select a server in the left pane, then select their tables. On Toast Go handhelds select the server first. Requires 1.17 Change Server. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)

**Opening a table and check**
- If the Table Details pane is hidden, selecting a table opens its order screen directly. If visible, it opens Check Details, and **Update** opens the full order screen. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Guest count: open Check Details and select the guest count to change it. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Quick Order alternative (no table): Quick Order mode, select a menu, a group, then an item. Search bar and **Open Item** cover off-menu items. On Toast Go 2 the menu shows first and check details stack on top; **All Checks** is in the action bar. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)

**Seats**
- Order by Seat lets servers enter orders separated by seat number when enabled. The ordering article does not list the seat-selection steps. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- After a seat is selected on check details, added items are assigned to that seat. It can be turned off in Toast Web under Front of House. A separate seat-header mode assigns items to the last chosen seat. [docs, excerpt; the exact page was not isolated, and the result set included the [POS FAQ](https://support.toasttab.com/en/article/New-POS-FAQ)]

**Hold, Send, Stay**
- **Hold**, **Stay** and **Send** appear only once at least one item is on the check. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- **Hold** keeps items on the check unfired; a held item "will not fire until it is selected and sent". [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- **Send** fires highlighted items and returns to the Table Service screen. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- **Stay** fires highlighted items and keeps the server on the order screen. If only some items are selected, the rest are automatically held. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- If **Send order after check is paid** is on in Toast Web, orders fire after payment and Send and Hold are removed. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)
- Items not yet sent (via Send, Print or Pay) can be removed without voiding; a void is needed only after sending. Note that Print and Pay also count as sending. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)

**Coursing and firing**
- Coursing can be set per mode (Quick order and Table service) to **Required** (every item needs a course before sending), **Optional** (prompted, can skip) or **Off**. With Required, create a drinks course or later courses may show as Hold on the KDS. [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- Setup: Toast Web > Kitchen > Pacing > Meal pacing > **Enable course pacing**. Course pacing and Server Item Firing cannot both be on; turn off **Individually Send and Hold Items** first. [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- Sending options: **Send courses individually** (servers control firing with Send, Hold, Stay) or **Send all courses to kitchen immediately** (extra firing rules, some needing a KDS or expo station). [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- Firing can be automated by elapsed time or when the previous course completes at the prep station. Or the expediter can fire manually: servers still send, but the expediter controls actual firing. [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- Courses are assigned automatically through menu group assignments or manually at order entry. Changing an item's course needs the **Course** modifier enabled under Front of house > Order screen setup > UI options > Additional Modifier Groups. [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- Coursing is in-store only; not available for Toast Online Ordering or integration partners. [docs] — [Course Firing Options](https://support.toasttab.com/en/article/Course-Firing-Options)
- A "firing by item prep time" capability exists. I saw the page title only. [docs, excerpt] — [Firing by item prep time](https://doc.toasttab.com/doc/platformguide/adminFireByPrepTime.html)

**Transfers**
- Move a check to a table, long-press route: press and hold the tile, select the check, **Move X Check**, select the destination table (change service area via the nav bar if needed), then **Confirm** or **Cancel**. Requires 1.16 Change Table. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Move a check to a table, short route: tap the table number, select the new table, **Move Check**. From Quick Order: overflow > **Transfer to Table**, select the table, **Move Check**. [docs] — [Transfer Items, Checks, Payments](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments)
- If the destination table already has an open check, the POS prompts to merge into one check or keep them separate on that table. [docs] — [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables)
- Transfer to another server: both must be clocked in (only clocked-in staff are listed). Open the check, tap the server name in the overflow menu ("(Change)"), choose the new server, tap **Send** or **Hold**. Needs 1.17 and 1.9; otherwise an on-duty manager override. [docs] — [Transfer Items, Checks, Payments](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments)
- Transfer of a closed check: reopen the original server's shift by removing their clock-out time, transfer, clock them out, redo their shift review, and hand any cash to the new server. [docs] — [Transfer Items, Checks, Payments](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments)
- Transfer an item between checks: note the destination check number in **All Checks**; on the source check select the item, overflow > **Split**, **Look Up Check**, enter the number, **Add**, **Done**. Needs 1.20. [docs] — [Transfer Items, Checks, Payments](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments)
- Transfer a payment: Payment Terminal > check > **Pay ($)** > select payment > **Adjust** > **Move Payment to a Different Check** > enter number. Captured card payments cannot be transferred. [docs] — [Transfer Items, Checks, Payments](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments)

**Order and pay at the table**
- On Toast Go handhelds, **Split evenly** and **Service charge** on the pay screen sit in the overflow menu. [docs] — [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)
- Guest QR payment at the table is covered under the online and QR section below.

### Inferences
- Toast's core design choice is that "sending" is per-item state, not per-check. A check can hold fired and held items side by side, and the default of "Stay" holding the rest makes partial firing the safe path.
- **Transferable to a small Indian cafe:** floor plan tiles with timer and spend, Send/Stay/Hold, move and merge by long press, guest count. **Probably excess for a small cafe:** expediter-fired coursing, Required coursing, server-coloured sections, shift-based server ownership of checks. "Send order after check is paid" is a good single switch for counter-service mode.
- The rule that a server transfer needs both staff clocked in, and the multi-step closed-check transfer, follow from server-owned cash and tip accounting. A cafe with shared tills could drop much of that.

### Gaps
- No Toast page I could read gives an explicit open-table sequence or says whether a guest count prompt appears. I did not infer one.
- Table status colours are not documented in the Manage Tables article. Only server colours are.
- Tip, signature and receipt behaviour specific to server-carried handheld pay-at-table: no step list found. The [Use Order by Seat] article was not read.

## Kitchen: KDS setup, prep stations and routing, expediter, fulfilment, recall, timing colours, 86ing and stock counts

### Takeaway
Toast uses two-level fulfilment: prep stations fulfil their items, which turns the expediter ticket green, and the expediter's fulfil clears it. Routing is configured centrally in Toast Web and per device on the KDS. Ticket-age colours exist behind a "Warning Colors" setting, off by default, but I could not verify the colours or thresholds.

### Cited Findings

**Setup and routing**
- Role is set on the device: overflow > **Device Setup** > **Kitchen Setup** > **Kitchen Expediter** Yes or No. For a prep station, then choose **Prep Stations**. Menus may differ on the "new experience" KDS. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)
- Expediter shows the entire order across stations; prep station shows only items routed to it. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)
- Prep stations are created at Toast Web > Kitchen > Kitchen stations > Prep stations and assigned to printers and expediters. Each can be "Prep station only", "Prep station and expediter", or expediter-only. If no station has Send to Expediter on, all items go to the expediter by default. [docs] — [Kitchen Configuration](https://support.toasttab.com/en/article/Basic-Kitchen-Configuration)
- A printer can act as expediter: Printing Mode "Always print expediter tickets". [docs] — [Kitchen Configuration](https://support.toasttab.com/en/article/Basic-Kitchen-Configuration)
- Modifier routing options: "Print or show modifier(s) only" and "Print or show item with modifier(s)". [docs] — [Kitchen Configuration](https://support.toasttab.com/en/article/Basic-Kitchen-Configuration)
- Dining option filter per device: **Device Setup** > **Ticket Display Options**. Station filter: **Device Setup** > **Kitchen Setup** > **Prep Stations**. [docs] — [Kitchen Configuration](https://support.toasttab.com/en/article/Basic-Kitchen-Configuration)
- Hardwiring the KDS (USB-C or RJ-45) with Wi-Fi disabled is recommended. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)

**Ticket screen and fulfilment**
- Tickets run oldest on the left to newest on the right. Selecting a ticket fulfils the whole order or a single item. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)
- **Show All Day View** gives a condensed count of each item still to prepare. **Production Item Count** summarises active orders at ingredient level. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)
- When all items on an expediter ticket are fulfilled at prep stations, the ticket turns green on the expediter. The expediter verifies and fulfils, and the ticket disappears. [docs, excerpt] — [KDS workflow, one expediter](https://doc.toasttab.com/doc/platformguide/platformKDSWorkflowUsingSingleExpo.html), [course pacing workflow](https://doc.toasttab.com/doc/platformguide/platformKDSWorkflowUsingCoursePacing.html)
- With two expediter screens, a ticket fulfilled at the first-level expediter turns yellow to indicate that. So yellow here means a fulfilment stage, not lateness. [docs, excerpt] — [KDS workflow, two expediters](https://doc.toasttab.com/doc/platformguide/platformKDSWorkflowUsingTwoExpo.html)
- Bump bars, a start queue and assembly lines exist as options. Page titles only for the first two. [docs, excerpt] — [bump bar](https://doc.toasttab.com/doc/platformguide/platformKitchenUsingBumpBars.html), [start queue](https://doc.toasttab.com/doc/platformguide/platformKdsStartQueue.html)

**Recall and unfulfil**
- **Show Recently Fulfilled** shows completed tickets in green on the left, so one can be unfulfilled. **Recall** reopens the most recently fulfilled ticket, labelled "RECALLED" in red; pressing again goes further back. [docs] — [Get Started With KDS](https://support.toasttab.com/en/article/Get-Started-With-the-Kitchen-Display-System?lang=en_US)
- Recall works only within **Recently Fulfilled Timeframe**, a setting in minutes that must be greater than 0. [docs, excerpt] — [Kitchen settings](https://doc.toasttab.com/doc/platformguide/adminKitchenDiningRoomReference.html), [Redisplaying tickets](https://doc.toasttab.com/doc/platformguide/adminRedisplayingTickets.html)
- With assembly lines, a prep station recall returns the ticket to the initiating station and it must pass later stations again. An expediter recall returns it to the first station. [docs, excerpt] — [Assembly Lines](https://support.toasttab.com/en/article/Get-Started-with-Assembly-Lines-for-Kitchen-Display-Screens?lang=en_US)

**Colours and timing**
- **Warning Colors** (Toast Web > Kitchen > Printers, tickets, & KDS devices > Kitchen and ticket setup) changes ticket colour as tickets age. Default Disabled. Changing it needs 6.2 Kitchen / Dining Room Setup. [docs, excerpt] — [Kitchen settings](https://doc.toasttab.com/doc/platformguide/adminKitchenDiningRoomReference.html), [KDS config quick reference](https://doc.toasttab.com/doc/platformguide/adminKdsConfigQuickRef.html)
- **Flash Changes** makes a changed ticket's header flash until acknowledged. [docs, excerpt; page not isolated, result set included] — [Kitchen settings](https://doc.toasttab.com/doc/platformguide/adminKitchenDiningRoomReference.html)
- Non-timing colours: per-item or per-modifier **KDS Color** background; modifiers without a background colour show red text; dining-behaviour border colours for **Dine in** versus **Take out, delivery, curbside**. Header emphasis can be **Check number** or **Table number**. Text size options with Medium default. [docs] — [Customize KDS Tickets](https://support.toasttab.com/article/Customize-the-Appearance-of-KDS-Tickets)

**86ing and stock counts**
- POS: log in with a manager-level passcode, press and hold a menu or modifier button to open Quick Edit, Inventory > **Out of stock**, **Done**, **Save and continue**. Reverse with **In stock**. [docs] — [86 an Item](https://support.toasttab.com/en/article/86-an-Item)
- Toast Web: Menus > Bulk management > Advanced properties, Show/Hide Inventory, enter 0, save and publish. Restock by deleting the 0. Toast Now app: **Stock** card, in-stock toggle (needs 4.5 or 5.2). [docs] — [86 an Item](https://support.toasttab.com/en/article/86-an-Item)
- On the POS an 86'd item is greyed out, unselectable, and shows a zero in the corner. Guests cannot order it online or through third parties. Changes can take a few minutes to sync. Duplicate items must each be 86'd. [docs] — [86 an Item](https://support.toasttab.com/en/article/86-an-Item)
- An item stays 86'd until marked back; no bulk "restock all" action and no described reset. [docs] — [86 an Item](https://support.toasttab.com/en/article/86-an-Item)
- Counts deplete automatically on sale, only with a running auto-fire device and outside Test Mode. With "Send orders after check is paid" on, the count drops after payment; otherwise on send. Reaching 0 marks **Out of Stock**. [docs] — [Stock Status and Count](https://support.toasttab.com/en/article/Setting-the-Stock-Status-and-Count-for-Menu-Items?lang=en_US)
- Quick Edit is blocked in offline mode, so 86ing fails during an outage. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)

### Inferences
- 86ing needs a manager passcode, not a cook's. Whether a KDS itself can 86 is undocumented in what I read, so a kitchen probably has to ask someone with POS access. This is worth reconsidering for a small cafe where one person runs everything.
- **Transferable:** prep station routing, single-level fulfil for a small kitchen, all-day counts, recall window, item and modifier colour, dine-in versus takeaway border, count-down stock with auto-86. **Excess for a small cafe:** two-level expediting, assembly lines. A printer-based expediter maps naturally onto KOT printing, which is likely the common Indian setup.
- The dependency of stock depletion on an "auto-fire device" is a warning sign: a stock count that silently stops depleting if one device is off. breadPOS should avoid a single designated device for this.

### Gaps
- **Ticket timing colours could not be verified.** I confirmed that Warning Colors exists and is off by default, but not its colours, number of levels, default minutes, or whether thresholds are per station. The relevant page returned 403 and excerpts cut off before these values. The yellow in the two-expediter flow is a different meaning, and other vendors' schemes should not be assumed.
- [Average fulfilment timers](https://doc.toasttab.com/doc/platformguide/platformKitchenAvgFullfillmentTimer.html) exist but were not readable.
- Whether a KDS can 86 an item directly: the 86 article does not cover KDS behaviour.
- Item-to-station assignment and inheritance steps are in "Configure and Assign Prep Stations", not read.

## Cashier: splitting, merging, discounts, payments, tips, cash drawer, cash-out and shift review

### Takeaway
Splitting is a dedicated screen with three modes, and split actions are newly richer (US rollout April 2026). Merging is a separate Payment Terminal action limited to open, unpaid checks. Shift review is a strict ordered gate before clock-out, built around US tip and server-held-cash accounting.

### Cited Findings

**Splitting**
- Requires 1.20 Split Checks; without it, a Manager Passcode is prompted. Works in Table Service and Quick Order, not Retail. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- On the check, tap **Split** (or overflow). On the Split screen: **Tap and drop** moves items to a new check, **Split evenly** divides a selected item by a number entered, **Split by seat** splits in one tap if seats are assigned. **Done** finishes. Undo by moving items back. Swipe to view split checks. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Splitting before sending creates separate kitchen tickets. If guests only want to pay separately, split at payment instead. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Split evenly at payment: on the payment screen tap **Split evenly**, choose the number. **Amount tendered** shows each share, **Balance due** what remains; the check closes when all paid. Note the same button name divides an item on the Split screen and the total on the payment screen. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Limit of nine ways on the **Split Check** button; beyond that, enter amounts one guest at a time. A later **Split by #** option on handheld and flex devices removes the cap, reaching US locations from Nov 11 2025. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734), [announcement](https://updates.toasttab.com/announcements/ann_xFhzueRBPuGNy)
- **Split > Split checks > Actions**: **Split item between selected seats** and **Move items to another check**. The article says AU, CA, IE, UK limited rollout; a later announcement extends it to the US from April 6 2026 (POS 2.104). The announcement is newer. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734), [announcement](https://updates.toasttab.com/announcements/ann_mqSt8QpRUctrg)
- Combining seats then splitting a new item may create an extra check: split first, then combine. If a seat's check is closed, the shared item skips it. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Service charges do not carry over on split by item and must be re-added. Item-level discounts are removed on moving and must be reapplied. On split evenly, an existing service charge is divided equally (stated for the CA, IE, UK flow). [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Partial tender: enter the amount in **Amount tendered** before choosing the tender type; check stays open until **Balance due** is paid. For loyalty across several accounts, split the check, not the payment. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)

**Merging**
- **Payment Terminal** > overflow > **Combine checks** > select checks > **Combine checks**. The first selected is the destination, with a banner such as "Combine into #10". Only Open checks without payments. Pre-authorised cards must be rerun. Any tip is attributed to the new server. [docs] — [Combine Checks](https://support.toasttab.com/en/article/Combining-Checks-1492892550423)
- Conflict: the same article says checks with payments cannot be combined, while [POS 2.82 release notes](https://doc.toasttab.com/doc/relnotes/techReleaseNotes2_82.html) describe combining checks with payments as a limited release enabled by Toast support. [docs, excerpt]
- Conflict: Combine Checks says dragging one table to another "merges the checks onto one order but keeps them as separate checks", while [Manage Tables](https://support.toasttab.com/en/article/New-POS-Managing-Tables) says the user is prompted to merge or keep separate. [docs]
- Checks cannot be merged through the API; employees do it on the POS. [docs, excerpt] — [split endpoint doc](https://doc.toasttab.com/doc/apiordersdraftdoc/apiOrdersSplitCheckEndpoint.html)

**Discounts**
- Single item: select the item, **Discount Item** (or **Discount** next to **Pay**), choose the discount, enter an amount if open, passcode if prompted. Whole check: overflow > **Discount** > **Entire check** or **Select Items**. Remove: select the item, tap **Discount**. [docs] — [Discount Items and Checks](https://support.toasttab.com/en/article/Discounting-Items-and-Checks)
- Each discount has a Permissions Level of Any User (default) or Manager. Manager level needs 3.1 Discounts, else a manager passcode. [docs, excerpt] — [Who can apply a discount](https://doc.toasttab.com/doc/platformguide/adminDiscountsRequireManager.html), [Permissions Reference](https://support.toasttab.com/en/article/Access-Permissions-Reference)
- Items have a **Can be discounted?** property; if No, the check shows $0 or "items included cannot be discounted". [docs] — [Discount Items and Checks](https://support.toasttab.com/en/article/Discounting-Items-and-Checks)

**Payments and tips**
- Pay screen: check on the left; saved pre-authorised card button at top when present; **Split evenly**, **Rewards**, **Service charge**, **Other payments** (gift card, house account, comp card). [docs] — [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)
- Payment Terminal: **Open**, **Paid**, **Closed** tabs with counts, search across tabs, blue stripe on the logged-in server's checks. [docs] — [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)
- Tip screen: highest suggestion prioritised, with **Custom tip** and **No tip** below. Whether it appears before or after payment is a device payment setting changed through Toast Customer Care. [docs] — [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)
- Receipt screen: **No receipt** prioritised; **Print**, **Text**, **Email**. Skippable through Device Setup. [docs] — [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)

**Cash drawer**
- Drawers are **Active**, **Open** or **Closed**, and can be locked to specific employees (Lockdown). The overview describes legacy functionality; a newer version is in limited release. [docs] — [Cash Management](https://support.toasttab.com/en/article/Cash-Management-Overview?lang=en_US)
- Relevant permissions: 1.7 Cash Drawer Access, 1.13 No Sale, 3.17 Cash Drawers (Blind), 3.18 (Full), 3.19 Lockdown Override, 3.20 Large Cash Over/Under, 3.21 Adjust Start Balance, 3.22 Pay Out. [docs] — [Permissions Reference](https://support.toasttab.com/en/article/Access-Permissions-Reference)

**Shift review (employee, in order)**
1. **Close Checks**: close or pay each open check; move with overflow > **Change Server**; a green check mark confirms the step.
2. **Declare Cash Tips** (tipped jobs, if enabled): enter total, **Declare**; **No Tips** for 0; minimum tip percentage can apply; **Update Cash Tips**, **Reopen Shift** to fix.
3. **Reconcile Cash and Tips**: Toast calculates what is owed; **Pay $**, **Collect $** or **Pay and Collect $**; choose a drawer or **Don't Use Cash Drawer**; exchange physical cash; **Next**. With **Pay out through payroll** only **Pay $** shows.
4. **Close Cash Drawers** (if locked to a drawer and enabled): **Close Drawer**, count into **Cash Actual** (**Count Bills** opens a calculator), see **Cash Over**, **Cash Short** or **No Difference**, comment up to 45 characters if required. Over the threshold, a manager must approve.
5. **Clock Out** (or **Clock Out & New Shift**), optional **Print Shift Review**, **Complete Shift Review**.

All [docs] — [Shift Review Checklist](https://support.toasttab.com/en/article/Shift-Review-Checklist-for-Employees-and-Managers)

- Managers can make shift review required or optional. [docs, excerpt] — [Shift Review Overview](https://support.toasttab.com/en/article/Shift-Review-Overview)

### Inferences
- **US-specific or strongly tip-driven:** Declare Cash Tips, minimum tip percentage, tip prompt ordering, card tip adjustment and the open-paid-closed gap, tip payout through payroll, pre-authorised tabs. Tipping in a small Indian cafe would need at most a light optional field, not a step in shift close.
- **Transferable:** split modes (by item, by seat, evenly), partial tender with Balance due, combine by destination-first selection, count-and-compare drawer close with variance threshold and manager approval, a green tick checklist that gates clock-out. Partial tender matters for mixed cash and UPI, though UPI was not researched here.
- Two design hazards to avoid: discounts and service charges silently lost on item moves, and one "Split evenly" label with two meanings.
- "Cash Drawers (Blind)" suggests a blind-count mode, but I did not verify its meaning.

### Gaps
- "Use Cash Drawers" article could not be fetched (404 at the guessed URL), so opening a drawer, starting balance, cash in, pay out and No Sale steps are unverified.
- Exact cash and card tender steps, and reopening a closed check, are in other articles not read.

## Manager: approvals and permissions, voids versus comps and reasons, closing the day, end-of-day reports

### Takeaway
Permissions are a numbered list assigned to jobs or individuals. Lacking one triggers a manager passcode prompt at the point of action, so there is no separate approval queue in what I read. Voids have enforced preset reasons, but I found no equivalent reason list for comps. Close Out Day is an optional audit screen because an automatic 4 a.m. cutoff does the actual closing.

### Cited Findings

**Permission model**
- Numbered groups include: POS Access (1.x), Delivery (2.x), Manager (3.x). Examples: 1.1 Table Service Mode, 1.2 Quick Order Mode, 1.3 KDS Mode, 1.4 Payment Terminal Mode, 1.5 Orders Hub Mode, 1.6 Apply Cash Payments, 1.8 and 1.9 view and edit others' orders, 1.14 Key in Credit Cards, 1.15 Offline/Background Credit Card Processing, 1.16 Change Table, 1.17 Change Server, 1.20 Split Checks; 3.1 Discounts, 3.4 Bulk Transfer, 3.5 Bulk Void, 3.6 Bulk Close, 3.7 Void Items/Orders, 3.8 Void/Refund Payments, 3.9 Unlinked Refunds, 3.10 Edit Sent Items, 3.12 Shift Review, 3.14 Edit Time Entries, 3.16 Close Out Day, 3.25 Open Items, 3.28 Tax Exempt, 3.29 Throttle Online Orders, 3.31 Configure Auto-Close, 3.32 Void/Refund Payments (Same Day). [docs] — [Permissions Reference](https://support.toasttab.com/en/article/Access-Permissions-Reference)
- Set at job level (Team > Settings > Jobs) or per employee (Team > Employees, pencil, **Edit custom permissions**). Changes must be published. [docs] — [Cash Management](https://support.toasttab.com/en/article/Cash-Management-Overview?lang=en_US), [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Point-of-action approval is documented for split (Manager Passcode), discount (manager passcode), transfers (on-duty manager override), drawer variance (manager must approve), and above-limit offline card payments (manager override). [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734), [Discounts](https://support.toasttab.com/en/article/Discounting-Items-and-Checks), [Transfers](https://support.toasttab.com/en/article/Transferring-Items-Checks-and-Payments), [Shift Review Checklist](https://support.toasttab.com/en/article/Shift-Review-Checklist-for-Employees-and-Managers), [Offline Prep](https://support.toasttab.com/en/article/Offline-Mode-Training-Guide)
- Main overflow **Switch user** returns to the keypad for another login. [docs] — [Manage Orders](https://support.toasttab.com/en/article/New-POS-Experience-Ordering-Screens)

**Voids, comps, refunds**
- Definitions: **Void** removes an item, check or same-day payment as if it never happened. **Comp** waives the charge for an item the guest received but isn't paying for. **Refund** returns money after capture, typically on a prior business day. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)
- Item: Payment Terminal, check, **Update**, item, **Void**, confirm, reason if prompted. Quantity: enter the quantity, remainder stays. Multiple items: first enable **Multiple Items** in Device Setup > Default Item Selection Mode > Order Screen. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)
- Whole check: **Update**, overflow, **Void Order**, confirm, reason. Voided open checks cannot be reopened. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)
- Captured payment same day: **Closed Checks**, open, **Pay**; cash **Void**, card **Adjust**; confirm, reason, recollect if needed. Prior business day: refund only. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)
- Requiring manager approval is achieved by removing 3.32 and 3.8 from the server's job. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks)
- Reason codes: Toast Web > Finance > Related > Settings > Void reasons; name, optional description, active, save and publish. With at least one active reason, staff are prompted automatically. No free text; Toast suggests an "Other" reason with periodic review. [docs, excerpt] — [Add Void Reasons](https://support.toasttab.com/en/article/Add-Void-Reasons)
- Comp mechanics: employees need 3.1 Discounts "to apply or comp discounts", and "comp card" is listed under **Other payments**. [docs] — [Discounts](https://support.toasttab.com/en/article/Discounting-Items-and-Checks), [Manage Payments](https://support.toasttab.com/en/article/New-POS-Managing-Payments)
- A partner guide says a comp is set up as a 100%-off manager-level discount, and to comp rather than void if inventory has already been affected. [third-party] — [Lunchbox](https://support.lunchbox.io/en/articles/8684632)
- Conflict: the void article names the required permission "3.31 Void/Refund Payments – Same Day", but the Permissions Reference lists 3.31 as Configure Auto-Close and 3.32 as same-day void. The reference and the void article's own approval section agree on 3.32, so 3.31 looks like an outdated number. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks), [Permissions Reference](https://support.toasttab.com/en/article/Access-Permissions-Reference)

**Close of day**
- At 4:00 a.m. Toast closes paid unclosed checks, clocks out remaining employees, and auto-captures uncaptured card payments. Auto-clock-out can be disabled through Customer Care. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Conflict: my fetch says the cutoff is ET for US, local for UK, IE, AU, CA, while a search excerpt of the same article family says "4 a.m. relative to your time zone". Unresolved; confirm before relying on it. [docs, excerpt]
- Manager Activities > **Close Out Day**: described as an optional audit screen. Paid checks: **Close all (no tips)** or **Adjust tips**. Orders: **Mark all picked up** or **View orders**. Employees: **Clock out all** or **View employees**. Unpaid: **Close checks**. **End day** stays unavailable until open checks are resolved. **Auto-resolve** handles paid checks and clock-outs, not unpaid checks. Needs 3.16. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Unpaid checks are not closed unless auto-close or auto-void is enabled; auto-close uses a dedicated "Auto-Close" other payment type. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture); [docs, excerpt] — [Auto-Close or Auto-Void](https://support.toasttab.com/en/article/Enable-Auto-Close-or-Auto-Void-for-Check-Reconciliation)
- Recommended order: cash deposit should be the last cash action, after checks are closed, shift reviews complete, and drawers closed. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Manager shift review: Manager Activities > **Review Employee Shifts** (3.12). Statuses: Active Shift, Cash Collected, Paid Out, Closed Shift, Clocked Out. A manager can complete a review for someone who left. Reopen only in the current business week: **Edit**, **Yes, Make Edits**, **Re-Open Shift**; this deletes prior Tip Out and Cash Collected entries. Prior weeks through Toast Web Drawer History or Customer Care. [docs] — [Shift Review Checklist](https://support.toasttab.com/en/article/Shift-Review-Checklist-for-Employees-and-Managers)

**Reports**
- Z report prints from Close Out Day to a receipt printer, any time, without ending the day. Sections: sales categories, sales and taxes summary, payment details, voids, removals, discounts, card and other payment breakdowns, labor, over/short, pay outs, deposit summary, delivery. Configure at Team > Settings > Manager end of day report. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Regional: UK and Ireland figures are tax-inclusive; US and Canada based on net sales excluding tax. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- **Service Report** under Manager Activities gives Z-style data by daypart. [docs] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)
- Toast Web > Reports > Cash and loss management: Voided orders (orders, items, amount, percent by reason) and Voided payments. [docs] — [Void Items](https://support.toasttab.com/article/Voiding-Items-Payments-and-Checks); [docs, excerpt] — [Cash and Loss Reports](https://support.toasttab.com/en/article/Exceptions-Report-Overview)
- Z Report and Sales Summary are not directly comparable, because of different scope and inclusion rules. [docs, excerpt] — [Close Out Day](https://support.toasttab.com/en/article/Close-Out-Day-Z-Report-Auto-Capture)

### Inferences
- **Transferable:** passcode-at-the-moment-of-need approval (well suited to an owner nearby), preset void reasons, void versus refund by business day, Z report sections, auto business-day cutoff that closes paid checks, close-day checklist. Tax-inclusive reporting exists as a Toast regional variant, showing that report logic needs a tax-mode switch; how GST should work was not researched here.
- **US-specific or heavier than needed:** the granular permission list (60 numbered entries in the POS, delivery and manager groups alone, while a cafe likely needs a few roles), nightly auto-capture of card batches (whether this applies depends on breadPOS's payment rails), tip adjust steps at close.
- Toast's distinction that voids prompt for a reason while comps run through discount permissions leaves comps less audited than voids in what I could read. breadPOS could treat both alike.

### Gaps
- No comp reason list or comp-specific flow found. The sources describe comps only by definition and through discount or "comp card" mechanics; the Lunchbox setup is third-party. I could not confirm whether voids restore inventory or stock counts; the void article is silent.
- The void article cites payment permissions for item voids, while the reference separately lists 3.7 Void Items/Orders. Which applies to items is unclear.
- Z report "shows the previous seven days by default" versus a "one-day sales summary" (excerpt): this may mean a date picker covering seven days, but I could not confirm.
- Manager passcode mechanics (single use, whether the approver is logged, audit trail) are not described in what I read.

## Offline mode: what keeps working, what does not, how it syncs

### Takeaway
Ordering, cards with deferred authorisation, printing, and hardwired KDS keep working on a local network. Anything touching money reconciliation, stock changes, loyalty, gift cards or online orders stops. The restaurant carries the risk of declined offline cards. Toast is moving from per-device storage to a local hub.

### Cited Findings

**Works**
- New orders on POS and Toast Go; card payments and tips if background card processing is on (described as on by default, changeable only while online); printing and drawers if Ethernet stays connected; clock in and out, ideally on one device; manual drawer closing from the POS Device Menu. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- Hardwired KDS receives in-store tickets if UPnP multicast is on and at least one hardwired non-Elo V1 Toast device acts as the local hub. All devices should be on one subnet. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- Mobile Order & Pay limited: guests can view the menu and pay checks opened before the outage. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- A banner appears on affected devices after about 40 seconds. [docs] — [Offline Prep](https://support.toasttab.com/en/article/Offline-Mode-Training-Guide)

**Does not work**
- Shift review (close checks, declare tips, reconcile, and clock out where reviews are required, until pending payments process). Gift cards. Loyalty earn or redeem. Quick Edit, including 86ing and price overrides. New pre-authorisation. New online and Mobile Order & Pay orders. Reporting excludes offline devices until sync. Toast advises against running payroll. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- Note: "clock in and out" and "cannot clock out" both appear; the blocker is required shift review. A page on [completing shift review offline](https://doc.toasttab.com/doc/platformguide/adminCompletingShiftReviewOffline.html) exists but was not readable, so a workaround may exist. [docs, excerpt]

**Cards**
- Staff verify name and expiry, and use chip and PIN when possible. Receipts show "Pending" until reconnect. Keep merchant copies. The restaurant is responsible for declines, expired cards and disputes. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- Options set in advance: keep accepting with pending authorisation, go cash-only (tapping Card shows a redirect dialog), or set a transaction limit. Above-limit needs someone with 1.15. A dedicated offline dining option captures contact details. [docs] — [Offline Prep](https://support.toasttab.com/en/article/Offline-Mode-Training-Guide)

**Sync and recovery**
- On reconnect, stored payments are submitted and captured automatically. Do not press Capture on Close Out Day, which can cause missed authorisations and deposit discrepancies. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)
- Check Reports > Payments > Payments for Denied status. Denied payments cannot be re-run; collect a new payment from the guest. Authorisations can expire as early as 24 hours after the transaction. [docs] — [Offline Prep](https://support.toasttab.com/en/article/Offline-Mode-Training-Guide)
- Staff must not unplug Ethernet, power off devices, restart the router, log out, or uninstall. Uninstalling loses order and payment data irrecoverably. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)

**Architecture**
- Legacy: devices communicate only through the cloud, so offline data stays on each device. Local sync: one automatically assigned hub (wired, active, not handheld, not Elo V1; support can reassign) relays between devices on the local network and to the cloud. Without an eligible hub, devices fall back to legacy. Toast plans to deprecate legacy; no date found. [docs, excerpt] — [Local Sync](https://doc.toasttab.com/doc/platformguide/platformOfflineModeLocalSync.html), [Overview](https://doc.toasttab.com/doc/platformguide/adminOfflineModeOverview.html), [KDS devices](https://doc.toasttab.com/doc/platformguide/platformOfflineKDSDevices.html)
- Under local sync, staying logged in matters: after logging out a device cannot log in until connection returns. Devices on other subnets cannot share data while offline. [docs, excerpt] — [Local Sync](https://doc.toasttab.com/doc/platformguide/platformOfflineModeLocalSync.html)
- Online and Mobile Order & Pay tickets are not received until the auto-fire device is back. DoorDash and Uber Eats can continue through separate backup protocols. Online ordering can be disabled temporarily and re-enabled in Toast Web. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US)

### Inferences
- **Highly transferable as a requirements list:** local hub for KDS or KOT continuity, offline banner, no logout during outage, block on destructive device actions, pending state on receipts, denied-payment review queue. Cash-heavy sales lessen the deferred-card risk, but UPI behaves differently from offline card auth (not researched here), so Toast's offline card model does not map directly.
- Blocking 86ing offline is a notable weakness: an outage does not stop items running out. An offline-first breadPOS could treat 86 as a syncable local event.
- Toast's own migration suggests per-device offline storage was not enough in practice: orders stranded on a device cannot reach the kitchen.

### Gaps
- No per-transaction or total dollar offline limit defaults found; the limit is restaurant-set.
- The "Recover and Get Back Online" article was not read, so handling of conflicts on open or unbalanced checks after reconnect is unverified.
- Conflict resolution between devices after outage (for example two devices editing one check) is not documented in what I read.
- Whether legacy offline devices can see each other's checks is implied by the excerpt but not stated directly.

## Online and QR ordering, and third-party delivery integration

### Takeaway
All channels converge on one POS check and one kitchen path. Online orders pass through approval rules, third-party orders skip them, and a single designated "auto-fire" device drives firing. Orders Hub is the operating screen for off-premise work.

### Cited Findings

**First-party online ordering**
- Guests order pickup, curbside or delivery from a branded page; orders enter the POS as in-house ones do, with no per-order commission. [docs, promotional in tone] — [Online Ordering](https://support.toasttab.com/en/article/Getting-Started-Online-Ordering)
- One POS device per location must be the auto-firing device, ideally on Ethernet. Two cause duplicate kitchen tickets. [docs] — [Online Ordering](https://support.toasttab.com/en/article/Getting-Started-Online-Ordering)
- Approval modes: **Manual** (wait in Pending Orders), **Direct to kitchen** (recommended), **Rules** (fire unless a cash threshold, credit minimum, delivery minimum or total amount rule triggers). [docs] — [Online Ordering](https://support.toasttab.com/en/article/Getting-Started-Online-Ordering)
- Payment: cash, card or both. Split across two cards unsupported. Own drivers or Toast Delivery Services, not both; the latter is unavailable in Canada, Ireland, UK. [docs] — [Online Ordering](https://support.toasttab.com/en/article/Getting-Started-Online-Ordering)

**Orders Hub**
- Tabs: **Needs Approval**, **Scheduled**, **Active** (default), **Order Ready**, **Completed**. All but Scheduled clear at end of business day. [docs] — [Orders Hub](https://support.toasttab.com/en/article/Managing-Off-Premise-Orders-with-Orders-Hub), [Status Breakdown](https://support.toasttab.com/en/article/Orders-Hub-Status-Breakdown)
- Flow: **Approve** (ASAP to Active, future to Scheduled), **Fire Now** on the auto-fire device only, **Order Ready** (texts the guest if set up), **Complete** (greyed out until paid; **Pay** first). **Reopen** returns to Active. [docs] — [Orders Hub](https://support.toasttab.com/en/article/Managing-Off-Premise-Orders-with-Orders-Hub)
- Own drivers: **Complete**, **Dispatch Driver**, choose, **OK**, then **Complete** after delivery. **Manage Online Orders** turns ordering on or off, snoozes, or adds a delay (3.29). [docs] — [Orders Hub](https://support.toasttab.com/en/article/Managing-Off-Premise-Orders-with-Orders-Hub)

**QR ordering and payment (dine-in)**
- Mobile Order & Pay: guest scans a table-specific QR, browses, picks items and modifiers, submits; the order goes straight to the kitchen. Group tabs combine guests' orders on one ticket if enabled. [docs] — [Mobile Order & Pay](https://support.toasttab.com/en/article/Mobile-Order-and-Pay-Overview)
- Server-started: server begins on table management, guests join by scanning; after an item is sent, guests add from their device; at payment they pay for only their items or the entire check. [docs] — [Mobile Order & Pay](https://support.toasttab.com/en/article/Mobile-Order-and-Pay-Overview)
- Re-scan and **Pay Check** after the meal. [docs, excerpt] — [Group Ordering](https://support.toasttab.com/article/Group-Ordering-on-Toast-Mobile-Order-PayTM-INTERNAL)
- "Pay in less than 10 seconds" with Apple Pay. [marketing claim inside a support page] — [Mobile Order & Pay](https://support.toasttab.com/en/article/Mobile-Order-and-Pay-Overview)
- Toast Pay (scan-to-pay only): printed receipt QR "View check and pay now"; no app needed; view itemised check, tip, pay. Splits evenly only, not by item; first guest starts the split, others scan or get a link; the remainder can be settled on the POS. Servers get POS notifications at first part paid and when closed; Table Service shows real-time payment status per table. Setup: Finance > Related > Settings > Toast Pay. [docs] — [Toast Pay](https://support.toasttab.com/en/article/Get-Started-with-Toast-Pay)
- Third-party scan-to-pay on Toast supports single-check orders only, failing if staff split the check. [third-party] — [storekit](https://storekit.com/docs/guides/integrations/pos/toast/pay-at-table)

**Third-party delivery**
- Uber Eats setup: add through Toast Shop (US), complete checklist, connect account, confirm the fixed dining options "Uber Eats Takeout" and "Uber Eats Delivery" and the Uber Eats other payment option (if missing, all orders fail), set menu visibility to "Online Orders: Partners". [docs] — [Uber Eats](https://support.toasttab.com/en/article/Getting-Started-Uber-Eats-Integration)
- Toast Web is the source of truth: menu and price changes sync in minutes; edits in the Uber portal are overwritten; 86 updates in real time; a markup can be set without changing the POS price. [docs] — [Uber Eats](https://support.toasttab.com/en/article/Getting-Started-Uber-Eats-Integration)
- Orders appear on the POS with itemisation, guest first name and last initial, and the order ID in Tab Name. They fire ASAP with no approval. Marked ready automatically if KDS Order Ready toggle is on, else manually in Orders Hub. [docs] — [Uber Eats](https://support.toasttab.com/en/article/Getting-Started-Uber-Eats-Integration)
- Limitations include no scheduled orders, no pre-modifiers, no self-delivery, one Uber account per Toast account, and no pre-launch testing. [docs] — [Uber Eats](https://support.toasttab.com/en/article/Getting-Started-Uber-Eats-Integration)
- Loyalty cannot be earned or redeemed on third-party orders. [docs, excerpt] — [Earn Points](https://support.toasttab.com/en/article/How-Guests-Earn-Points-with-Toast-Loyalty)
- Partner cancellations and refunds go through the partner. DoorDash and Grubhub cannot be voided from the POS; an FAQ excerpt says Uber Eats can, while the Uber article says contact Uber Eats Support. Conflict unresolved. [docs, excerpt] — [Orders Hub FAQ](https://support.toasttab.com/en/article/Orders-Hub-FAQ); [docs] — [Uber Eats](https://support.toasttab.com/en/article/Getting-Started-Uber-Eats-Integration)
- Scheduled Grubhub orders fire by prep time before the requested time (9 PM with 30-minute prep fires at 8:30 PM). [docs, excerpt] — [Grubhub](https://support.toasttab.com/en/article/Grubhub-Integration-Overview)

**Order and check states from developer docs (useful for data modelling)**
- Check `paymentStatus`: OPEN (outstanding balance), PAID (card applied, tip not yet adjusted), CLOSED (nothing due). Cash goes open to closed; card goes open, paid, closed. Toast does not prevent CLOSED moving back to OPEN or PAID. [docs, excerpt] — [Check schema](https://doc.toasttab.com/openapi/orders/tag/Data-definitions/schema/Check/), [Tracking order state](https://doc.toasttab.com/doc/platformguide/adminOrderStates.html), [Order object](https://doc.toasttab.com/doc/devguide/apiOrdersOrderObjectSummary.html)
- Payment-level status includes AUTHORIZED (approved, not captured) and CAPTURED. [docs, excerpt] — [Payment schema](https://doc.toasttab.com/openapi/orders/tag/Data-definitions/schema/Payment/)
- `approvalStatus`: NEEDS_APPROVAL (created, not fulfilled until approved), APPROVED (automatic if no approval required), NOT_APPROVED (if nobody approves in time). [docs, excerpt] — [Order schema](https://doc.toasttab.com/openapi/orders/tag/Data-definitions/schema/Order/)

### Inferences
- **Transferable:** table-specific QR, server-started plus guest-joined single check, guest pays own items or all, real-time paid status on the floor plan, approval rules by amount, an Orders Hub with the tab sequence Needs Approval, Scheduled, Active, Ready, Completed, and a markup for aggregators with POS as the menu source of truth. **Region-specific and needing separate research:** the partners. Swiggy and Zomato integration behaviour cannot be read across from Toast's docs. Apple Pay and the US-only express checkout do not transfer directly; UPI would be the likely equivalent, not researched here.
- The paid-before-closed state exists mainly because card tips are adjusted after payment. Without tip adjustment, breadPOS may not need it, though authorised versus captured is a separate question for its payment rails.
- The single auto-fire device is a clear single point of failure and a source of duplicates. It is worth designing out rather than copying.

### Gaps
- Whether Mobile Order & Pay supports an approval or staff-confirm step before kitchen firing: the overview does not describe one. For a cafe wary of prank orders this matters; unverified.
- DoorDash integration article not read directly; Toast Delivery Services flows not researched beyond Redispatch. The "Tabs" and "Pay as you Go" modes are named but not explained in what I read.
- Throttling mechanics beyond snooze, delay and quote time not read.

## Guest loyalty flow

### Takeaway
Loyalty is points-based, tied to an email or phone, and surfaced at payment. Enrolment is prompted at checkout on many surfaces, and redemption happens on the pay screen before the tender is chosen. Linked card recognition is a key convenience that only works for cards.

### Cited Findings
- Guests need an email or phone, set in Toast Web > Marketing > Loyalty > Settings. [docs] — [Enroll](https://support.toasttab.com/en/article/How-Guests-Enroll-in-Toast-Loyalty)
- Enrol surfaces: POS checkout or Toast Go prompt (**Claim rewards**), closed check (**Update**, **Pay**, **Rewards signup**), guest-facing display, digital receipt link, online ordering post-order, kiosk at order start, Local by Toast pre-selected check box, mobile payments post-checkout, shareable link. A welcome email or text follows. [docs] — [Enroll](https://support.toasttab.com/en/article/How-Guests-Enroll-in-Toast-Loyalty)
- Staff can enter details if the guest asks, but guests must sign up themselves; the restaurant can't consent on their behalf. [docs] — [Enroll](https://support.toasttab.com/en/article/How-Guests-Enroll-in-Toast-Loyalty)
- Earn: staff attach the account to the check; points accrue fractionally (1 point per $15, $10 spent gives 0.66). [docs, excerpt] — [Earn Points](https://support.toasttab.com/en/article/How-Guests-Earn-Points-with-Toast-Loyalty)
- Redeem, Method 1: paying with a linked card prompts redemption automatically if enough points (not for cash). Method 2: pay screen **Rewards**, find by 16-digit key-in, scan, swipe, or name, phone or email lookup, then **Redeem**; applies as a discount before tender so it works for cash and card. [docs] — [Redeem](https://support.toasttab.com/en/article/Redeeming-Points-with-Toast-Loyalty)
- Reward types: fixed cash and free item (full cost deducted even if the check is lower, no partial credit), progressive cashback in older programs (all points up to the balance due), tiered (each tier unlocks separately, guest picks), birthday. [docs] — [Redeem](https://support.toasttab.com/en/article/Redeeming-Points-with-Toast-Loyalty)
- Free item rewards can only be redeemed in-store on POS, guest-facing display and kiosk. [docs, excerpt] — [Item-Based Rewards](https://support.toasttab.com/en/article/Optimize-Toast-Loyalty-with-Item-Based-Rewards)
- Guests can't tip by card if a reward pays the check in full. Balance adjustments: Toast Web > Reports > Marketing > Rewards accounts. [docs] — [Redeem](https://support.toasttab.com/en/article/Redeeming-Points-with-Toast-Loyalty)
- Split payments don't accrue points correctly across accounts: split the check instead. [docs] — [Split Checks](https://support.toasttab.com/en/article/Splitting-Checks-by-Item-1492811097734)
- Loyalty works neither offline nor on third-party orders, and is not yet available in Canada, Australia, Ireland or UK for Mobile Order & Pay. [docs] — [Offline Mode](https://support.toasttab.com/en/article/Using-Toast-in-Offline-Mode?lang=en_US), [Mobile Order & Pay](https://support.toasttab.com/en/article/Mobile-Order-and-Pay-Overview)

### Inferences
- **Transferable:** phone-number enrolment at checkout, lookup by phone at the pay screen, redeem before tender so it works with any payment type, item-based rewards (coffee-card style suits a cafe), retroactive signup from a closed check. **Weak fit:** linked card recognition, which assumes card payment and does not cover cash. An equivalent for UPI was not researched. Consent rules for marketing messages in India were not researched either.
- Toast's no-partial-credit rule on fixed rewards is simple but can feel unfair on small checks, so it may deserve a warning on screen.

### Gaps
- The Redeem article says in-store guests "can only redeem birthday rewards", which conflicts with the rest of the same page if read literally. Probably it means birthday is the only special reward type in store, per a search excerpt, but I could not confirm.
- Guest-facing display enrolment flow is in a separate guide, not read. Offline accrual catch-up (whether points are credited after reconnect) was not stated.
