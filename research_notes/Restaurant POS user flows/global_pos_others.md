# Global restaurant POS user flows: Square for Restaurants, Lightspeed Restaurant, TouchBistro, Revel Systems

Research date: 2026-11-05. Toast is out of scope.

**How far to trust each product's evidence. Read this before using the notes.**

| Product | Evidence quality | Why |
|---|---|---|
| Square | Strong | Help articles were opened and read. |
| Lightspeed K-Series | Strong | Support articles were opened and read. |
| Lightspeed L-Series | Medium | Some articles were read, others are excerpts only. I could not confirm whether L-Series is still sold to new customers. |
| TouchBistro | Weak | `help.touchbistro.com` returned an empty page shell, `cdn.touchbistro.com` failed on SSL, and `www.touchbistro.com/help` redirects to the shell. Docs claims come from search excerpts only. Excerpts were reported as about 2,100 to 2,800 days old (6 to 8 years). |
| Revel | Weak, and may be end of life | Help pages returned HTTP 401 or an empty shell, so docs claims come from search excerpts only. Excerpts were reported as about 2,400 to 2,900 days old. `revelsystems.com/products/revel-smartorder/` now redirects to `shift4.com`. See the Revel status note below. |

**Labels.**
- `[docs]`: vendor help page that I opened and read.
- `[docs, excerpt]`: vendor help page seen only as a search-result excerpt. Treat it as unconfirmed detail, and do not treat button labels as exact.
- `[marketing]`: vendor product page or blog.
- `[third-party]`: press, a competitor blog, or a community forum post. Square Community threads are labelled this way even when a Square staff member replied.

Even the opened pages were read through an extraction step, so check exact labels against the live page before quoting them in specs.

**Revel status.** Shift4 closed its purchase of Revel on 13 June 2024 ([third-party](https://thepaypers.com/payments/news/shift4-acquires-majority-stake-of-vectron-systems-and-completes-acquisition-of-revel-systems)). Its CEO said "You don't need two restaurant products" and that Revel's best capabilities would move into SkyTab ([third-party](https://www.restaurantbusinessonline.com/technology/payment-processor-shift4-acquire-revel-systems-250m)). A competing vendor claims merchants are being migrated and feature work has effectively stopped ([third-party, competitor and possibly biased](https://koronapos.com/blog/what-happened-to-revel-pos/)). I found no primary Shift4 statement on timing. Treat Revel flows as historical design references, not as a live product benchmark.

---

## Table and floor management, order taking, coursing, seats, transfer and merge

### Takeaway
All the products with readable docs treat a table as a container for a check, and make seats and courses optional layers on top of it. The biggest differences are when items may move and how a table transfer or merge is triggered. Square has a drag on the floor plan, while Lightspeed K-Series uses an Actions menu and only allows it after items are sent.

### Cited Findings

**Square**
- Seat tracking is enabled per device, as optional or required seat positions, under More > Settings > Checkout > Seating ([docs](https://squareup.com/help/us/en/article/8583-manage-seats-in-your-restaurant)).
- Cover counts cannot be detached from seat numbers, so staff keep them accurate by adding and removing seats ([docs](https://squareup.com/help/us/en/article/8583-manage-seats-in-your-restaurant)).
- A guest changing tables is handled by seat menu > Transfer to Check > pick check > Save, and the seat lands as a new seat at the destination ([docs](https://squareup.com/help/us/en/article/8583-manage-seats-in-your-restaurant)).
- Floor plan gesture: long-press a table tile and drag it onto another table. An empty target receives the check, and an occupied target prompts to confirm a merge ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)).
- Merge Tables can only be performed on Square Register. Terminal and Handheld can only view merged tables ([docs](https://squareup.com/help/us/en/article/8583-manage-seats-in-your-restaurant)). The check management article does not state a device limit for the drag gesture, so whether drag-to-merge works on handhelds is unverified.
- An item can move to a Different Course, New Check or Existing Check. A whole check moves or merges through Actions > Move ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)).
- Server reassignment is separate from moving: Actions > Assign > team member ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)).
- Coursing is enabled per POS mode in the Dashboard. In the cart, staff pick a course, add items, tap fire or hold on each course, then Send. A held course is not sent or printed until fired, and firing later sends a fire ticket ([docs](https://squareup.com/help/us/en/article/7748-coursing-with-square-kds)).
- Square's coursing article does not cover auto-fire ([docs](https://squareup.com/help/us/en/article/7748-coursing-with-square-kds)).
- A community reply says tickets print by firing time, not course number, so firing course 2 first prints it first ([third-party](https://community.squareup.com/t5/Orders-Menu-Items-Catalog/On-restaurants-my-coursing-order-keeps-printing-backwards-or-out/td-p/799349)).

**Lightspeed K-Series**
- Opening: pick a table on the floor plan, or key the table number and tap Tables. Orders stay in Direct Sale mode until a table or tab is assigned. Cover entry is optional, set in the Back Office ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089273-Adding-orders-in-Table-Service-mode)).
- Items default to Course 1. A display mode toggles to By seat, and items stay shared until assigned ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089273-Adding-orders-in-Table-Service-mode)).
- Send uses "Send - x items". Firing is Actions > Fire course. Status icons are a white arrow for unfired, an orange flame for fired and a green check for completed ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089273-Adding-orders-in-Table-Service-mode)).
- Unsent items can move between seats and courses. Sent items can only move to a different seat or table ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050328554-Editing-and-reviewing-orders)). This is contradicted in part by [docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089273-Adding-orders-in-Table-Service-mode), which says sent courses can no longer be moved to a different course or seat. The two Lightspeed articles disagree on whether a seat move is allowed after sending.
- Table transfer is only possible after items are sent to a production center. Whole order: Actions > Transfer to another table > choose from the Orders List or Floor plan > Merge ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/10032856591643-Transferring-items-and-orders-to-other-tables)).
- At clock-out, staff with open orders are prompted to transfer them to a clocked-in user, who authorizes with their own PIN or QR if one is set ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)).

**Lightspeed L-Series**
- Only tables with ordered items can be merged or transferred. If the destination is occupied, the user is asked to confirm the merge. The "Allow transferring items between tables/tabs" role is required ([docs, excerpt](https://resto-support.lightspeedhq.com/hc/en-us/articles/226405488-Transferring-and-merging-orders)).

**TouchBistro**
- Seat transfer: information icon on the seat > Transfer Group to Another Table > tap the target on the floor plan. Items can also go to a bar tab ([docs, excerpt](https://cdn.touchbistro.com/help/articles/moving-items/)).
- An admin setting, Require Passcode to Transfer Seats/Parties, exists as a defence against a "wagon wheel" scam ([docs, excerpt](https://cdn.touchbistro.com/help/articles/using-touchbistro-help-protect-wagon-wheel-scam/)).
- Floor plan design, sections and taking orders by table are described on a product page ([marketing](https://www.touchbistro.com/features/floor-plan-table-management/)).

**Revel**
- Move Table: if the destination already has items, the POS combines them, and this cannot be undone. A mistake means voiding and rebuilding the order ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204576105-Table-Service-Restaurant-TSR-Point-of-Sale-Guide)).
- Move Items sends an item to another table or bar tab. Transfer Order or Transfer Owner reassigns the server ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204576105-Table-Service-Restaurant-TSR-Point-of-Sale-Guide)).
- Guest count can be set or changed per order ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204576105-Table-Service-Restaurant-TSR-Point-of-Sale-Guide)).

### Inferences
- Where they differ:
  - Square has separate verbs for Move (location or check) and Assign (server). Revel excerpts show the same separation.
  - Lightspeed K-Series blocks table transfer before send, whereas Square's docs show no such rule.
  - Square hard-limits merging to one device class.
- Small cafe pattern: keep seats and courses off by default and let the owner switch them on. Square and Lightspeed both show they can be optional. A cafe mostly needs table to check to send.
- Small cafe pattern: a drag on the floor plan with a confirm on occupied targets is the simplest merge model seen. Revel's irreversible merge is a warning: breadPOS should make merge undoable, or at least keep the original checks reconstructable.
- A clock-out handoff of open orders, as in K-Series, suits small shift changes because it stops orphaned checks.

### Gaps
- TouchBistro coursing and fire flow, and table merge: no source found. Not the same as absent.
- Revel course firing steps: a Table Service Settings article exists but I could not open it.
- K-Series reassignment of a dine-in order to another server outside clock-out: not confirmed. An excerpt only showed it for pickup, delivery and bar tabs.
- Whether Square's drag-to-merge is limited to Register: not stated.

---

## Kitchen display: routing, stations, expo, item availability and 86

### Takeaway
Square and Revel have an explicit expo concept. Lightspeed's KDS 2.0 docs do not describe one and instead use a per-station status flow. For 86, Square has the cleanest cafe-suitable pattern: a long-press to sold out that resets automatically at the end of the business day.

### Cited Findings

**Square KDS**
- Station types are chosen when creating the device code: Prep or Expeditor. Expo finalizes orders and oversees prep ([docs](https://squareup.com/help/us/en/article/7944-get-started-with-square-kds-android)).
- Completion can apply across stations or only to the current device. On Prep it covers all Prep stations, and on Expo it covers all Expo and Prep stations ([docs](https://squareup.com/help/us/en/article/7944-get-started-with-square-kds-android)).
- Routing is two independent filters:
  - Source: which POS devices feed the KDS, plus a toggle for online, kiosk and delayed orders ([docs](https://squareup.com/help/us/en/article/7959-route-orders-with-your-kds)).
  - Kitchen routing categories, created in the Dashboard and switched on per screen. They do not change menu or reporting categories ([docs](https://squareup.com/help/us/en/article/8170-filter-orders-by-category-with-square-kds)).
- KDS extras: yellow and red timers, All Day counts with fired and held split, staggered prep times, and modifier colours ([docs](https://squareup.com/help/us/en/article/7944-get-started-with-square-kds-android)).
- KDS runs only on Android tablets, needs a Plus or Premium plan and adds a per-device fee ([docs](https://squareup.com/help/us/en/article/7959-route-orders-with-your-kds)).
- Undo after completion is about three seconds. Recall moves a completed ticket back to open ([docs, excerpt](https://squareup.com/help/us/en/article/8171-complete-orders-with-square-kds)).
- Holding a ticket open until the expo clears it was described as a feature request at the time, with a workaround of an expo-only item ([third-party](https://community.squareup.com/t5/Questions-How-To/Multiple-KDS-one-expo-How-to-make-the-expo-not-complete-until/m-p/255713)).

**Square availability and 86**
- Each item variation is Available, Sold out or a remaining quantity. Available with no quantity means unlimited ([docs](https://squareup.com/help/us/en/article/6425-managing-items-with-square-for-restaurants)).
- Long-press an item on the POS Menu tab to change it. Bulk editing is not supported ([docs](https://squareup.com/help/us/en/article/6425-managing-items-with-square-for-restaurants)).
- Without a chosen reset, sold-out items return to available at the end of each business day ([docs](https://squareup.com/help/us/en/article/6425-managing-items-with-square-for-restaurants)).
- Availability updates across POS, online and integrated channels ([docs](https://squareup.com/help/us/en/article/6425-managing-items-with-square-for-restaurants)). A product page says a kiosk change applies to every kiosk ([marketing](https://squareup.com/us/en/hardware/kiosk)).
- Modifiers can be marked sold out too ([docs, excerpt](https://my.squareup.com/help/us/en/article/8430-mark-items-and-modifiers-as-sold-out)).

**Lightspeed K-Series KDS 2.0**
- One POS is a dedicated hub that serves the screens over the local network, and it must always remain on. Screens connect through a browser to the hub IP plus a code ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22168531609499-Setting-up-Kitchen-Display-System-2-0)).
- Each named station receives selected items, by all items or by menu category ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22168531609499-Setting-up-Kitchen-Display-System-2-0)).
- States are New, Preparing, Ready to collect, On hold, Canceled and Completed. The POS shows matching statuses ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22708154090267-Using-the-Kitchen-Display-System-2-0)). New and Ready to collect can be deactivated ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22168531609499-Setting-up-Kitchen-Display-System-2-0)).
- Bump by double tap or long press, or per item. Undo appears for five seconds after completion. The archive holds until the POS signals the end of the shift ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22708154090267-Using-the-Kitchen-Display-System-2-0)).
- Each course is its own ticket by default, labelled "Not fired" until fired from the POS. A setting combines courses into one ticket ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22708154090267-Using-the-Kitchen-Display-System-2-0)).
- Neither KDS 2.0 article describes an expo role ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22708154090267-Using-the-Kitchen-Display-System-2-0)).

**Lightspeed K-Series availability**
- There are two separate mechanisms ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/10724827631259-Setting-up-and-using-Item-availability)):
  - Snooze for 1, 12 or 24 hours or indefinitely, which is focused on Order Anywhere and needs a web extension to work from the POS.
  - A sales restriction counter: long-press the item > Availability > Limited or Unavailable, with a quantity. Restocking makes the item available again automatically.

**Lightspeed L-Series Kitchen**
- Excerpts indicate it needs a separate iPad from the POS, and was available only in English at the time of the article ([docs, excerpt](https://resto-support.lightspeedhq.com/hc/en-us/articles/360038744293-About-Lightspeed-Kitchen)).

**TouchBistro**
- Add a KDS under printers and kitchen displays, then assign menu categories. Multiple screens are supported ([docs, excerpt](https://cdn.touchbistro.com/help/articles/setting-up-the-kds/)).
- Tapping an item marks it fired, turning it yellow and starting a timer. A long press removes that. The KDS was described as one-way, with no fired or up status returned to the POS ([docs, excerpt](https://cdn.touchbistro.com/help/articles/using-the-kds/)). This may be stale, since the product is now marketed as "Powered by Fresh" ([marketing](https://www.touchbistro.com/blog/benefit-of-touchbistro-kds/)).
- Marketing claims station routing, a consolidated expo or head chef view, an optional bump bar and cross-screen handoff ([marketing](https://www.touchbistro.com/kitchen-display-system/)).
- Each menu item has an "Item in Stock" toggle that flags it out of stock on the order screen ([docs, excerpt](https://cdn.touchbistro.com/help/articles/setting-menu-items/)).

**Revel**
- A product reaches a KDS or printer only once assigned, per product or in bulk by import, and can go to more than one ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204843525-How-to-assign-products-to-the-kitchen-display-unit-KDS-)).
- Kitchen flows are set up by Revel support on request. You supply the display count and the sequence, such as sandwich then salad then sides. With Bump, an item must complete on all bumping views before moving to the expo ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/205001925-Kitchen-Flow-Bump-Feature-Setup)).
- A station can exclude printers, which overrides product-level assignment ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/360024595332-How-to-Exclude-Printers-for-Stations)). KDS Redirect sends one display's orders to another when it is closed ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/360038934692-KDS-Redirect)).
- Staff can mark products, modifiers and ingredients unavailable from the POS, as documented in a DoorDash integration article ([docs, excerpt](https://support.revelsystems.com/s/article/DoorDash-Marketplace)).

### Inferences
- Where they differ:
  - Square has a station type chosen at setup.
  - Lightspeed K-Series uses a local hub plus browser screens, so screens are cheap but there is a single device that must stay on.
  - Revel's multi-screen flows needed vendor help in the docs seen.
  - Square's routing categories being independent of menu categories is a useful data-model choice: a cafe can route "Coffee" and "Hot food" without restructuring its menu.
- Small cafe pattern: one screen with optional routing, no expo by default, and bump as a single tap. Add a short undo window, since Square (about 3 seconds) and Lightspeed (5 seconds) both provide one.
- Small cafe pattern: a status echoed back to the POS, as in Lightspeed, tells a lone cashier or server when an order is ready without walking to the kitchen.
- Small cafe pattern: copy Square's long-press sold out with automatic reset next business day, so a stale 86 does not silently kill tomorrow's sales. Allow bulk marking, which Square lacks.

### Gaps
- KDS-side 86 (marking unavailable from the kitchen screen): not documented in anything I read for any of the four products. The flows seen start from the POS or Back Office.
- Revel: current KDS behaviour unverifiable.
- TouchBistro: no expo bump walkthrough found, and no current help page on KDS status back to the POS.

---

## Billing: split and merge, discounts, voids and comps, permissions and manager approval or PIN override

### Takeaway
Square, TouchBistro and Revel excerpts agree on the same rule: void if the item has not been made or delivered, comp if it has. They differ on approval. Lightspeed L-Series and TouchBistro show an inline second-person code, K-Series docs show permission gating with no override flow, and Square's override appears only in narrower cases in the articles read.

### Cited Findings

**Split**
- Square, from Actions > Split check: by seat, by item, split an item into portions, split evenly, recombine ([docs](https://squareup.com/help/us/en/article/8165-split-a-payment-and-check-with-square-for-restaurants)).
- Square limits ([docs](https://squareup.com/help/us/en/article/8165-split-a-payment-and-check-with-square-for-restaurants)):
  - Needs a Plus or Premium plan.
  - Modifier costs split with the parent item.
  - Portions cannot be split again, and voiding one fraction recombines the item.
  - Recombining works only during the current split, or later if all portions have returned to the original check.
  - Cart-level discounts stay on the original check in a seat split.
  - Split payments divide by amount only.
- Lightspeed K-Series: enable Advanced check splitting in the Back Office, then Split check > Distribute by seat. Shared items are divided across seats, and shares can be edited by hand. Lightspeed warns that four shared beers across four guests become 0.25 per check, which can be confusing ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089493-Splitting-a-bill)).
- K-Series split by covers: the extracted steps also start with Distribute by seat, then Actions > Split receipt - X parts ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360051089493-Splitting-a-bill)). The label looks odd, so verify it live.
- TouchBistro: Split By Seating gives each guest a check while shared items stay on the table. A Split Item Among Seats option appears only after the order ticket is sent ([docs, excerpt](https://help.touchbistro.com/s/article/specifying-seats-for-a-shared-item?language=en_US)).
- Revel: tap Pay, then Split Bill: evenly, manually by amount, by item, or by seat. It must be enabled in the Management Console. Undoing a split needs a PIN from someone with refund permission if the owner lacks it ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/205125635-Split-Bills-)).
- L-Series: items must be sent before they can be split across seats ([docs, excerpt](https://resto-support.lightspeedhq.com/hc/en-us/articles/227598528-Using-the-Actions-Panel)).

**Void and comp**
- Square separates void (item not yet made or delivered) from comp. Each works per item or per check with a required reason, and comp sits under "Discount/Comp" ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)).
- A beta Real Time Check View allows bulk comp, void, move or remove on selected items ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)).
- Lightspeed K-Series: select a sent item > Void line > reason. It is logged with user, table, item, date and reason ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050328554-Editing-and-reviewing-orders)). Void reasons must be created in the Back Office first ([docs, excerpt](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804657449-Understanding-void-reasons)).
- TouchBistro: if the food has not reached the table, void it. If it has, you cannot void and must use a 100% comp discount ([docs, excerpt](https://cdn.touchbistro.com/help/articles/using-discounts-and-voids-to-correct-errors/)).
- Revel: a comp is generally for food already prepared and a void is for items not yet prepared ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204576105-Table-Service-Restaurant-TSR-Point-of-Sale-Guide)). Comps need a setting enabled, and the void flow notes whether the item returns to inventory ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/115005088546-How-to-Void-Comp-Refund-or-Exchange-Items)).

**Discounts**
- K-Series discounts must first be created in the Back Office. They apply per item from Edit, or to the order through Actions > Apply a discount. A user's permissions set which discounts they can apply ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050328554-Editing-and-reviewing-orders), [docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804594690-Managing-POS-users)).
- K-Series price edits are one-off through Edit > Adjust price, do not sync to the Back Office, and are permission-gated ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050328554-Editing-and-reviewing-orders)).
- Revel price overrides require a manager's password ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204947635-Advanced-POS-Settings)).

**Approval and PIN override**
- L-Series Elevated Permissions: a restricted action shows a lock icon, an "Authorization Needed" popup appears, and a user with the elevated role enters their PIN so the action can complete ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/226406048-Using-elevated-permissions)).
- TouchBistro: a manager or admin enters their confirmation code for a void, and should not log in and do it themselves ([docs, excerpt](https://cdn.touchbistro.com/help/articles/voiding-an-item-2/)).
- Revel: owner and manager access tokens let a PIN count as a valid password for restricted actions ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/205153595-Role-Permissions-Guide)). If "only order owner may close check" is on, another person closing a check is prompted for a manager PIN ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204947635-Advanced-POS-Settings)).
- Square: moving another team member's check needs a passcode or the permission ([docs](https://squareup.com/help/us/en/article/6429-check-management-with-square-for-restaurants)). In close of day, managers can override requirements with the owner passcode only ([docs](https://squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)).
- K-Series: permissions include refunds, voiding sent items, item and table transfers, access to others' tables, table protection bypass and price changes ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804594690-Managing-POS-users)).

### Inferences
- Where they differ:
  - L-Series, TouchBistro and Revel excerpts show a second person's code at the moment of the action.
  - K-Series and Square articles read show mostly role gating. A staff member without the right has no documented inline path.
  - TouchBistro's rule that a manager should enter the code on the server's session, not log in, keeps the audit trail attached to the original user.
- Small cafe pattern: void and comp differ by whether the item was already sent or served. breadPOS could choose automatically based on item state instead of asking staff to know the terminology.
- Small cafe pattern: a lock icon plus inline manager PIN is the simplest approval model seen. It suits a cafe where the owner is nearby. Record both the requester and the approver, and require a reason.
- Small cafe pattern: split evenly and by item cover most cafe bills. Square's and Lightspeed's fractional and shared-item handling is where the visible complexity and limits live, and could be deferred.

### Gaps
- Square: whether void, comp and discount can require an inline manager passcode. The permission-set article does not list those permissions, and the passcode article does not cover on-demand override. Not verified either way.
- K-Series: inline manager override. Not found in the articles read, and the elevated permissions article is L-Series only.
- L-Series: what is logged when elevated permissions are used. The page does not say.
- Square discount flows beyond the Discount/Comp entry: not documented in the articles read.

---

## Shift and cash management, end-of-day close

### Takeaway
There are two models. A guided close wizard that can block on open checks, drawers, tips and clock-outs (Square, Revel), and a sales-period model where a manager opens and closes the trading period (Lightspeed K-Series). Cash drawers are often a separate layer, and on Square it is a paid add-on.

### Cited Findings

**Square**
- Close of day: Account > Run Close of Day > preview > run > confirm > optional print ([docs](https://squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)).
- Location-level settings can require closing open checks and drawers, adjusting tips and clocking out staff ([docs](https://squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)).
- Open checks are excluded from the report. It cannot run offline and needs a Plus or Premium plan ([docs](https://squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)).
- Drawer sessions need the Cash Management Add-on. Start with starting cash in the POS only, record Pay In/Out with a description, and End Drawer with the counted cash. Ending can also be done from the Dashboard ([docs](https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session)).
- Sessions open over 30 days with at least 7 days of inactivity auto-end ([docs](https://squareup.com/help/us/en/article/8344-start-and-end-a-cash-drawer-session)).
- A community user reports no built-in way to force counts at set times ([third-party](https://community.squareup.com/t5/Payments-Troubleshooting/How-to-require-a-cash-drawer-report/td-p/805943)).

**Lightspeed K-Series**
- If the sales period is closed, only shift managers can clock in, so it must be opened before others can ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)).
- Clock-in may prompt a drawer count. Clock-out may prompt a drawer count, tip declaration or user summary report ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)).
- Report levels: User report for one user's shift, Shift report and Drawer report per sales period, Fiscal report per business day. The Drawer report shows opening cash, payments, expected and actual cash. The default business day is 5:30 AM to 5:29 AM ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050328874-About-POS-reports)).

**Lightspeed L-Series**
- Employees use the Profile screen for drawer functions, servers use End Shift, and managers use End Day to close tables, handle tips and reports, and clock out other users ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115005099693-About-users)).
- Cash Drawers > amount and reason > Add cash for the start, or Final count for the close ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/226306047-Cash-drawer-start-and-final-counts)).

**TouchBistro**
- Close through Admin | Perform End of Day. Account charges appear in the report but not in cash or card receipts ([docs, excerpt](https://cdn.touchbistro.com/help/articles/understanding-account-reporting/)).
- Non-sale cash uses a Pay In/Payout button, and a Payouts report can be added to End of Day ([docs, excerpt; exact page unconfirmed](https://cdn.touchbistro.com/help/articles/understanding-account-reporting/)).
- No Sale opens the drawer and records who and when, with a No Sale Report by staff member ([docs, excerpt; exact page unconfirmed](https://cdn.touchbistro.com/help/articles/generating-payment-reports/)).
- Servers have a Shift Report showing cash owed to the house ([docs, excerpt](https://cdn.touchbistro.com/help/articles/understanding-shift-report/)).
- Older release notes say only Manager-role staff types could perform end of day, approve voids or adjust clock times. A "Can Manage Shifts" option arrived in 6.2 ([docs, excerpt](https://cdn.help.touchbistro.com/TouchBistro-release-notes-v-6-2.pdf)).

**Revel**
- Tills support pay-ins, pay-outs, safe deposits, and transfers between virtual and physical tills. Each entry logs employee, drawer, station and reason ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/209483726-Till-Management-Guide)).
- End of shift: cashier taps Tills > select till > End Shift > optional summary print > Submit. It needs the "Tills - Close a Till" permission, or the button is greyed out ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/115004644646-End-of-Shift-Process-)).
- The End of Day wizard surfaces open or held transactions and cannot complete while the POS is in Offline Mode ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204163039-How-to-Set-Up-and-Run-the-End-of-Day-Process)).

### Inferences
- Where they differ: K-Series controls who can start trading through the sales period. Square and Revel focus on the close. Revel excerpts show the most granular till model (virtual and physical tills, safe drops), which is more than a small cafe needs.
- Small cafe pattern: one drawer per location, with an opening float, pay in or out with a reason, and a blind count at close that shows expected versus actual. The L-Series flow of amount, reason, then Add cash or Final count is a compact model.
- Small cafe pattern: a single close-of-day checklist with blocking items, on the Square model, but in a small venue the clock-in, drawer open and day open can be the same action.
- Square and Revel refuse to close offline. If breadPOS is to work offline, it needs to decide this explicitly. L-Series can end shifts and days offline through its LiteServer (see the offline section).

### Gaps
- "Blind count" is my suggestion. I did not verify whether any of the four hides the expected amount during the count.
- Current TouchBistro close flow, and whether a drawer session concept exists. The excerpts only show reports and Pay In/Payout.
- K-Series sales period open and close steps: linked articles not read.

---

## Inventory and recipe or ingredient deduction

### Takeaway
All four have some sale-driven ingredient deduction, but with very different limits. Square's beta is deliberately simple and cannot handle modifiers or size variations. Revel excerpts show modifier-level deduction, and Lightspeed adds batch production through a separate add-on.

### Cited Findings
- **Square Recipes (beta):**
  - Plus or Premium plan only, and the item must be the Prepared Food & Bev type.
  - Selling reduces each tracked ingredient by the recipe quantity.
  - If any tracked ingredient is short, the item auto-marks sold out, and staff can override and still sell it ([docs](https://squareup.com/help/us/en/article/8629-beta-track-ingredient-costs-with-square-recipes)).
- **Square limits:**
  - No nested recipes or batch prep.
  - Modifiers cannot have recipes, so add-ons do not deduct stock or affect cost.
  - Items with multiple variations cannot have recipes, so sizes must be modelled as separate items.
  - Square recommends starting with the top 10 to 20 items ([docs](https://squareup.com/help/us/en/article/8629-beta-track-ingredient-costs-with-square-recipes)).
- **Square on-hand versus available:** Available is on hand minus stock committed to open checks, saved carts and scheduled orders. Stock changes require an adjustment reason ([docs](https://squareup.com/help/us/en/article/6425-managing-items-with-square-for-restaurants)).
- **Square partner:** fuller ingredient tracking is offered through a MarketMan-based product ([marketing](https://squareup.com/ie/en/inventory-management/restaurants)).
- **Lightspeed K-Series recipes:**
  - Made to order recipes update inventory as items sell. Made in batches recipes cover bulk production such as dough or croissants.
  - The finished product and ingredients must already exist in the Item list ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/4407511552155-Creating-and-managing-recipes)).
  - Finishing a batch deducts its ingredients ([docs, excerpt](https://k-series-support.lightspeedhq.com/hc/en-us/articles/4407567874843-Creating-and-managing-batches)).
  - Stock levels may show decimals, since stock is in bottles or boxes and recipes are in millilitres or grams ([docs, excerpt](https://k-series-support.lightspeedhq.com/hc/en-us/articles/4407517612699-Stock-levels)).
  - Legacy Stock closed to new customers in June 2023 in favour of the Inventory add-on ([docs, excerpt; exact page unconfirmed](https://k-series-support.lightspeedhq.com/hc/en-us/articles/4406108262043-About-stock-management)).
- **TouchBistro:**
  - Each menu item has a Manage Recipe section. Sales draw down ingredients, for example taco and Coke deducting tortilla, steak, syrup, ice and straw ([docs, excerpt](https://cdn.touchbistro.com/help/articles/setting-using-touchbistro-ingredient-based-inventory-system/)).
  - Adjust takes the actual stock count, not a delta ([docs, excerpt](https://cdn.touchbistro.com/help/articles/setting-using-touchbistro-ingredient-based-inventory-system/)).
  - Low-stock warnings appear to the server on adding an item, and the Pro version warns logged-in managers when an item is out ([docs, excerpt](https://cdn.touchbistro.com/help/articles/setting-menu-items/)).
- **Revel:**
  - Selling a product with a recipe reduces ingredient counts, including through online ordering ([docs, excerpt](https://support.revelsystems.com/s/article/Ingredients-Recipes-Guide-1583150212848)).
  - Ingredients can attach to modifiers and deduct when the modifier is selected ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/360021085732-How-to-Attach-Ingredients-to-Modifiers-with-Recipes)).

### Inferences
- Modifier deduction is the key differentiator for a cafe. Milk type and extra shot are modifiers. On Square's beta they would not touch stock, while Revel excerpts show this is possible. breadPOS should decide this early, because it shapes the data model.
- Size variations are the second issue. Square's rule forces Small, Medium and Large latte into separate items for recipes, which is awkward in a cafe.
- Batch prep matters for cafes baking in-house. K-Series's made-to-order versus made-in-batches split is a simple two-type model to borrow.
- Square's auto sold-out with a staff override is sensible: inventory counts in a small cafe are rarely exact, so the system should warn and not hard-block.

### Gaps
- Whether a Square item auto-resets after an ingredient-driven sold out: not stated.
- K-Series recipes and modifiers: the recipes article does not mention modifiers.
- Whether voids return ingredient stock: the Revel excerpt suggests it is noted, but I did not verify behaviour in the other three.

---

## QR ordering and order-and-pay flows

### Takeaway
There are two distinct patterns. Pay-only QR on a printed bill (Square Scan to Pay, Lightspeed Scan to Pay) is a light add-on to staff ordering. Full table ordering through a per-table QR (Lightspeed Order Anywhere, Square Online self-serve, Revel SmartOrder) is a separate product surface. Lightspeed is best documented, and TouchBistro shows no documented in-venue ordering flow.

### Cited Findings

**Square**
- Scan to Pay staff flow: Print bill from the floor plan or Orders. The order shows a Printed status with a 3-minute timer. The POS notifies "Checks have been paid with a QR code", and the order moves to Closed labelled "Paid via QR Code". Guests scan the QR on the receipt ([docs](https://squareup.com/help/us/en/article/8456)).
- It requires a Plus or Premium plan and a printer ([docs](https://squareup.com/help/us/en/article/8456)).
- Self-serve ordering through Square Online: each QR is linked to one location such as a table. Guests order and pay immediately. Orders go to the POS and kitchen printers, and orders from the same table can be combined into one ticket ([marketing](https://squareup.com/au/en/online-store/restaurant-website/self-serve-ordering)).
- A seller reported dine-in-only items being hidden unless pickup was enabled ([third-party](https://community.squareup.com/t5/Payments-Troubleshooting/QR-code-ordering-for-dine-in/td-p/764631)).

**Lightspeed K-Series**
- Order Anywhere table flow: scan the table QR > items and modifiers > checkout with optional contact and tip > pay online, or choose pay before leaving ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260803553189-Placing-a-table-order)).
- The confirmation shows the order as pending until the restaurant confirms ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260803553189-Placing-a-table-order)).
- Scan and Pay: after eating, scan the table QR > Pay the bill > split by amount or by item, tip, emailed receipt ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260803553189-Placing-a-table-order)).
- Enabling "Allow customers to pay in person" means accepting responsibility for the unpaid order risk ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260803521850-Managing-Payment-settings)).
- POS Scan to Pay (announced in the August 2026 update): a dynamic QR on the guest check, where the guest reviews the bill, tips and pays, and the order closes automatically in the POS. It requires Lightspeed Payments ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/54972171065755-What-s-New-August-2026-Faster-payments-orders-and-insights)).
- Unavailable items show in the Order Anywhere menu as "Currently unavailable" when snoozed or "Item not available" at zero count ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/10724827631259-Setting-up-and-using-Item-availability)).

**TouchBistro**
- The QR Code Generator only links to a menu page on your own site, and does not host or generate the menu ([docs, excerpt](https://www.touchbistro.com/help/articles/touchbistro-qr-code-generator/)).
- Online Ordering is presented for pickup and delivery ([docs, excerpt](https://cdn.touchbistro.com/help/articles/touchbistro-online-ordering-diner-experience/)).
- A blog describes contactless scan, order and pay generically, without documenting a TouchBistro setup ([marketing](https://www.touchbistro.com/blog/guide-to-contactless-dining/)).

**Revel**
- SmartOrder: scan, browse in a mobile browser, add items and pay on the phone. Card, gift card and Apple Pay are claimed ([marketing, excerpt](https://revelsystems.com/products/revel-smartorder/)). That URL now redirects to Shift4, so availability under the Revel name is doubtful.

### Inferences
- Where they differ: K-Series supports both pay-first and pay-later at the table, with a staff confirmation step. Square's self-serve marketing shows pay-immediately. Lightspeed explicitly names the walk-out risk of pay-later.
- Small cafe pattern: pay-first per-table QR removes walk-out risk and needs no staff confirmation, which suits counter-style cafes. Pay-later suits sit-down cafes but needs a confirm step and a way of closing unpaid orders.
- Small cafe pattern: the printed bill QR is a cheap first step, because it needs no change to the ordering flow. Note it needs a printer, and Square's 3-minute timer implies a staff-facing status to watch.
- QR orders appending to an open table check is the crucial merge point. Square's marketing claim of combining same-table orders into one ticket should be checked as a real behaviour before being copied.

### Gaps
- Square Online self-serve documentation: article 7655 returned only an index page, so the flow is from marketing only.
- How Order Anywhere orders appear in the K-Series POS and reach the KDS, including auto-accept: the "Fulfilling orders" article was not read.
- Whether a Square QR order joins an existing staff-opened check: not verified.
- TouchBistro in-venue QR ordering: not found. Reseller or newer docs may show otherwise, so this is "not verified", not "does not exist".
- Revel SmartOrder table association and bill splitting: no docs found.

---

## Offline behaviour and sync

### Takeaway
Offline quality varies widely, and it depends on architecture. L-Series has a dedicated local server with a documented offline scope, Square takes payments offline but its KDS reportedly depends on the cloud, and K-Series KDS uses a local hub, though its own docs on offline scope are thin. Payment limits and data-loss warnings are the most specific documented details.

### Cited Findings

**Square**
- Offline payments are enabled per mode, with separate choices for internet outage and Square disruption (cash and card, or cash only) and an optional per-transaction cap ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- Register, Terminal and Handheld must upload within 72 hours. Readers stop accepting after 24 hours. Payments not uploaded within 72 hours expire and cannot be recovered ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- The seller carries the risk for declined, expired or disputed payments, and receives no decline notice while offline ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- Signing out, deleting the app, switching modes or locations, or factory resetting with pending payments loses them permanently. Restart or power off is safe ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- Offline payments cannot be refunded or cancelled until uploaded. Gift cards and manually keyed cards do not work offline ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- New online orders may not appear in the POS during a disruption ([docs](https://squareup.com/help/au/en/article/7777-process-card-payments-with-offline-mode)).
- KDS: users report screens not receiving tickets during outages ([third-party](https://community.squareup.com/t5/Orders-Menu-Items-Catalog/Feature-Request-Offline-POS-gt-KDS-capability/td-p/706108)). A community reply said an offline KDS mode was in development and looking at 2026 ([third-party](https://community.squareup.com/t5/Food-and-Beverage/KDS-Offline-Mode/m-p/709763)). I could not confirm whether it shipped.
- Printing offline: community reports conflict. One says POS printing works over the internal network if the internet goes down ([third-party](https://community.squareup.com/t5/Payments-Troubleshooting/Can-you-use-an-ethernet-kitchen-printer-when-in-offline-mode/m-p/682402)). Another, in the same thread, says network printers fail if offline mode is forced by leaving the WiFi. The difference may be internet loss versus LAN loss.

**Lightspeed K-Series**
- During an outage "most basic order-taking functions will still work offline", but connection is needed for card payments. The page lists orders not syncing to the Back Office or other POS devices as a symptom of network trouble ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/53288894613787-Troubleshooting-network-issues)).
- Standalone terminal payments are positioned as a fallback. They create no receipt ID, appear only in the Payments report, and must be recorded in the POS to appear in reporting ([docs, excerpt](https://k-series-support.lightspeedhq.com/hc/en-us/articles/5028210082715-Standalone-payments)).
- KDS 2.0 runs through a local hub on the same network. A screen's Events sync counter stalls when it drops and resumes on reconnect ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/22168531609499-Setting-up-Kitchen-Display-System-2-0)).

**Lightspeed L-Series LiteServer**
- A small local server that imitates the cloud servers and supports five to seven device stations ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115003529548-About-the-LiteServer)).
- Works in an outage: orders, receipts, transfers, bill splitting, POS reports, clocking in and out, ending shifts or days, and editing customers, floors, tables and stock ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115004026248-Using-the-LiteServer)).
- Does not work: integrated card payments, gift cards, third-party integrations, and configuration in Restaurant Manager. Nothing works if the local network itself is down ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115004026248-Using-the-LiteServer)).
- Sync: everything processed during the outage syncs on reconnect ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115004026248-Using-the-LiteServer)).

**TouchBistro**
- Offline mode keeps orders, closing, KDS sending and offline payments going, and devices keep communicating ([marketing, excerpt; product guide PDF was too large to open](https://marketingdev.touchbistro.com/wp-content/uploads/2024/07/TouchBistro-U.S.-Product-Guide.pdf)).
- TB Payments on Ingenico stores up to 100 offline payments, after at least one online payment, and needs a swipe, not dip or tap. Stored payments upload from Admin Settings > Setup > Upload Store and Forward Transactions ([docs, excerpt](https://cdn.touchbistro.com/help/articles/using-tb-payments/)).
- Moneris Store and Forward is the opposite: insert only ([docs, excerpt](https://help.touchbistro.com/s/article/Setting-Up-and-Using-Store-and-Forward-for?language=en_US)).

**Revel**
- Settings include a station-offline alert and a POS offline check interval of 5, 10 or 15 minutes. Offline card payments need a separate setting, with single-payment and total caps. Turning off offline mode before the gateway is back can lose transactions ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/115005714786-Offline-Mode-Always-On-Mode)).
- A manual offline mode exists ([docs, title only](https://support.revelsystems.com/hc/en-us/articles/360004984131-Manual-Offline-Mode-on-the-Point-of-Sale)). End of Day cannot complete in Offline Mode ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/204163039-How-to-Set-Up-and-Run-the-End-of-Day-Process)).

### Inferences
- Where they differ: L-Series and K-Series KDS show a local device that keeps the venue running. Square's community reports show dependence on the cloud for KDS. Local-first between POS and KDS is a real differentiator for venues with unreliable internet, such as many small cafes.
- The hub model has a cost: K-Series says the hub must always stay on, and L-Series says nothing works if the LAN is down.
- Small cafe pattern: make offline state visible, and block destructive actions while payments are pending. Square's permanent-loss warning on sign-out shows the failure mode. It is better to block sign-out than to warn.
- Small cafe pattern: treat card offline as a separately configured risk with a cap, as Square and Revel do. Cash and UPI or manual-record payments may be simpler. This depends on breadPOS's target market, which I did not research.

### Gaps
- K-Series: there is no dedicated article found on exactly what works offline or how queued orders reconcile. An excerpt mentioned passive and active POS devices relaying data, but I could not attribute it to a specific page, so verify it.
- Conflict resolution when two devices edit one order offline: not documented in anything I read for any of the four.
- TouchBistro's architecture: no source confirms a local server. Docs read were payment-specific and old.
- Square KDS offline release status as of November 2026: not verified.

---

## Staff login patterns: PIN codes, clock-in, per-role permissions

### Takeaway
All four use a short personal code that is both a login and a clock-in identity. They differ on whether clock-in and POS login are separate steps. Kitchen staff typically get clock-only access. Square's optional shared team passcode is a warning: it is simple but loses all per-person tracking.

### Cited Findings
- **Square passcodes:** owner (full access), shared team passcode, and personal 4-digit passcode. The team passcode cannot track sales, time or activity by person ([docs](https://squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale)).
- **Square timeout:** a configurable timeout sets when a passcode is needed again, per mode in the Dashboard or in the POS ([docs](https://squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale)).
- **Square permission sets:** Standard, Enhanced or Full, customizable, with access points such as Shared points of sale ([docs](https://squareup.com/help/us/en/article/6430-setting-up-your-employees-with-square-for-restaurants)).
- **Square time tracking:** team members need a personal passcode for clock-in and out. Early or unscheduled clock-ins can be blocked ([docs, excerpt](https://squareup.com/help/us/en/article/8389-set-up-time-tracking)).
- **Lightspeed K-Series login methods:** PIN of 4 to 6 digits, QR code, or iButton key. Users can be hidden from the POS ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804594690-Managing-POS-users)).
- **Lightspeed K-Series clock versus login:** clock-in starts the shift and login gives POS access, using the same PIN or QR or name tap. Role decides whether clock-in is required first, or whether the user can only clock in and out, such as kitchen staff ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)).
- **Lightspeed K-Series groups:** user groups apply the same rights to several users, such as servers or managers. Rights cover reports, discounts, receipts, voids, orders, payments, shifts and configurations ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260804594690-Managing-POS-users)).
- **Lightspeed L-Series:** one account per employee, personal login cards as an alternative to password or PIN, with role-driven End Shift and End Day ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115005099693-About-users)).
- **TouchBistro login:** staff get a passcode from a manager or owner, or the venue may use QR code login ([docs, excerpt](https://cdn.touchbistro.com/help/articles/server-guide-the-basics-of-touchbistro-for-servers)).
- **TouchBistro schedule enforcement:** with the 7shifts integration, staff cannot clock in unless scheduled, and there is no manager override for this ([docs, excerpt](https://www.touchbistro.com/help/articles/scheduling-integrations/)).
- **Revel PIN:** the PIN is the number used to clock in and out and to log in ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/360019088091-Employee-Details-)).
- **Revel roles:** a role such as chef can clock in and out without POS login, using the Login/Logout role permission ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/205153595-Role-Permissions-Guide)).
- **Revel stations:** login can be restricted per station, for example a bar terminal for bartenders only ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/115005543263-Restrict-Login-Access-to-a-Station)).

### Inferences
- Where they differ: K-Series explicitly separates clock-in from login. Square ties both to a personal passcode. Revel excerpts allow a role to have one without the other, as K-Series does.
- Small cafe pattern: a 4-digit personal PIN for everything, with one step that both clocks in and logs in, plus a short idle timeout on shared devices. Three or four preset roles (Owner, Manager, Server or Cashier, Kitchen) cover most cafes, with Kitchen as clock-only. Custom permission checkboxes can come later.
- Avoid a shared team PIN as the default. It is the easiest to set up, but Square documents that it gives up per-person tracking, which also undermines void and cash accountability.
- Avoid hard scheduling blocks without override. TouchBistro's documented lack of override shows how this can lock out staff.

### Gaps
- Whether Square exposes a name-tap login or per-action passcode list: the article says tasks can be selected but does not list them.
- TouchBistro's current staff type list and passcode length: not verified.
- Lockout, PIN reset and audit log detail for failed PIN attempts: not covered in anything read.

---

## How each role is handled, and simple patterns for a small cafe

### Takeaway
Across vendors, roles tend to be Owner, Manager, Server or Cashier, and Kitchen, though only some docs spell this out. A small cafe usually merges these into one or two people, so breadPOS's default flows should work for one person doing all of them, with the separations added only when staff grow.

### Cited Findings
- **Owner or admin:** only Square account owners can require passcodes and edit the owner passcode ([docs, excerpt](https://squareup.com/help/us/en/article/8357-require-passcodes-at-point-of-sale)). Close of day settings live only in the Dashboard ([docs](https://squareup.com/help/us/en/article/6594-end-of-day-reporting-with-square-for-restaurants)).
- **Manager:** in L-Series, End Day and clocking out others are manager tasks ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115005099693-About-users)). In K-Series, only shift managers can clock in when the sales period is closed ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)).
- **Server:** L-Series servers use End Shift to close remaining tables, adjust tips, print reports and clock out ([docs](https://resto-support.lightspeedhq.com/hc/en-us/articles/115005099693-About-users)). TouchBistro servers see cash owed to the house on a Shift Report ([docs, excerpt](https://cdn.touchbistro.com/help/articles/understanding-shift-report/)).
- **Cashier:** Revel cashiers reconcile their own till at End Shift ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/115004644646-End-of-Shift-Process-)).
- **Kitchen:** K-Series kitchen staff may only clock in and out ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/360050309174-Clocking-in-and-out)), and Revel chefs likewise ([docs, excerpt](https://support.revelsystems.com/hc/en-us/articles/205153595-Role-Permissions-Guide)).
- **Guest:** QR ordering and paying flows act as a fifth role ([docs](https://k-series-support.lightspeedhq.com/hc/en-us/articles/1260803553189-Placing-a-table-order)).

### Inferences
These are my synthesis for breadPOS, not vendor claims.

| Area | Simple cafe default | Add when needed | Evidence that it exists |
|---|---|---|---|
| Table | Table to check, drag to move or merge | Seats, courses | Square, K-Series |
| Kitchen | One KDS or printer, single-tap bump, undo window, status echo to POS | Category routing, expo | Square, K-Series |
| 86 | Long-press sold out, auto reset next day | Quantity counters | Square, K-Series |
| Billing | Split evenly and by item; void or comp by item state; inline manager PIN with reason | Fractional and shared items | Square, L-Series, TouchBistro |
| Cash | One drawer, float, pay in or out, count at close | Multiple tills, safe drops | L-Series, Square, Revel |
| Close | One checklist that blocks on open checks and open drawer | Fiscal reports, tip adjust | Square, Revel |
| Inventory | Recipes with modifiers and warn-not-block sold out | Batches, purchase orders | Revel, Square, K-Series |
| QR | Printed-bill pay QR, then pay-first table QR | Pay-later with confirm | Square, K-Series |
| Offline | Local POS to KDS, visible status, block sign-out with pending payments | Offline card with cap | L-Series, K-Series, Square |
| Staff | Personal 4-digit PIN, one step for clock-in and login, preset roles | Custom permission sets | Square, K-Series, Revel |

### Gaps
- Cafe-specific evidence is thin. These docs are written for restaurants in general. No vendor doc I read describes a small cafe flow as such. Lightspeed has a bakery and cafe page ([marketing](https://www.lightspeedhq.com/pos/restaurant/bakery-and-cafe-pos-system/)) that I did not open. Square has a quick service mode, also not studied in depth.
- Indian-market needs such as GST, UPI and local fiscal rules were out of scope, and the docs read here do not address them.
- No hands-on testing. Everything here is from documentation, so actual tap counts and screen layouts are not verified.
