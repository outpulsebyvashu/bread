-- breadPOS core schema (Supabase / Postgres). UNTESTED draft: run in a scratch project first.
-- Principles: roles enforced by RLS + RPCs; clients never write orders/payments directly.

create extension if not exists pgcrypto;

-- ───────── Identity & roles ─────────
create type app_role as enum ('admin','manager','cashier','captain','kitchen');

create table outlets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  niro_outlet_code text unique,          -- links this outlet to Niro Partner/Workforce
  created_at timestamptz default now()
);

create table staff (
  user_id uuid primary key references auth.users on delete cascade,
  outlet_id uuid references outlets,
  name text not null,
  role app_role not null,
  active boolean not null default true
);

create function my_role() returns app_role language sql stable security definer set search_path=public as $$
  select role from staff where user_id = auth.uid() and active $$;

create function is_role(r text[]) returns boolean language sql stable security definer set search_path=public as $$
  select coalesce(my_role()::text = any(r), false) $$;

create table settings (key text primary key, value text);
insert into settings values
  ('shop_name','breadPOS'), ('tax_pct','5'),
  ('max_cashier_discount_pct','10'),     -- above this, manager/admin must apply
  ('niro_points_per_100','10') on conflict do nothing;

create table floor_tables (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid not null references outlets on delete cascade,
  label text not null, unique (outlet_id, label)
);

-- ───────── Menu ─────────
create table categories (id uuid primary key default gen_random_uuid(), name text not null, sort int default 0);
create table items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories on delete set null,
  name text not null, price numeric(10,2) not null check (price >= 0),
  veg boolean default true,
  available boolean not null default true,      -- manual 86 toggle
  out_of_stock boolean not null default false,  -- set by stock triggers
  created_at timestamptz default now()
);
create table modifier_groups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references items on delete cascade,
  name text not null, required boolean default false, multi boolean default false
);
create table modifiers (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references modifier_groups on delete cascade,
  name text not null, price_delta numeric(10,2) default 0
);

-- ───────── Inventory (item-based, via recipes) ─────────
create table ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null, unit text default 'g',
  stock numeric not null default 0, low_at numeric not null default 0
);
create table recipe (
  item_id uuid references items on delete cascade,
  ingredient_id uuid references ingredients on delete cascade,
  qty numeric not null check (qty > 0),
  primary key (item_id, ingredient_id)
);

create function refresh_stock_flags() returns trigger language plpgsql security definer set search_path=public as $$
begin
  update items i set out_of_stock = exists (
    select 1 from recipe r join ingredients g on g.id = r.ingredient_id
    where r.item_id = i.id and g.stock < r.qty);
  return null;
end $$;
create trigger t_ing_flags after insert or update or delete on ingredients for each statement execute function refresh_stock_flags();
create trigger t_rec_flags after insert or update or delete on recipe for each statement execute function refresh_stock_flags();

-- ───────── Orders, payments, shifts ─────────
create sequence order_no_seq;
create table orders (
  id uuid primary key default gen_random_uuid(),
  no int not null default nextval('order_no_seq'),
  outlet_id uuid references outlets,
  source text not null default 'pos' check (source in ('pos','captain','qr')),
  table_label text, customer_name text, note text,
  status text not null default 'new' check (status in ('new','preparing','ready','served','cancelled')),
  subtotal numeric(10,2) not null default 0,
  discount numeric(10,2) not null default 0, discount_reason text, niro_reward_ref text,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  paid boolean not null default false,
  niro_member_id text, niro_points_earned int,
  created_by uuid references auth.users,
  created_at timestamptz default now(), accepted_at timestamptz, ready_at timestamptz, served_at timestamptz
);
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  item_id uuid references items on delete set null,
  name text not null, qty int not null check (qty > 0),
  unit_price numeric(10,2) not null, mods jsonb default '[]', note text
);
create table shifts (
  id uuid primary key default gen_random_uuid(),
  outlet_id uuid references outlets, cashier uuid not null references auth.users,
  opened_at timestamptz default now(), closed_at timestamptz,
  opening_float numeric(10,2) not null default 0,
  expected_cash numeric(10,2), counted_cash numeric(10,2), note text
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  shift_id uuid references shifts,
  method text not null check (method in ('cash','upi','card','other')),
  amount numeric(10,2) not null check (amount > 0), ref text,
  created_by uuid references auth.users, created_at timestamptz default now()
);
create table audit_log (
  id bigint generated always as identity primary key,
  at timestamptz default now(), actor uuid, action text not null,
  entity text, entity_id text, detail jsonb
);
-- Niro calls are queued here and drained by a Cloudflare Worker / Edge Function (retry-safe).
create table niro_outbox (
  id bigint generated always as identity primary key,
  kind text not null check (kind in ('earn','reverse')),
  order_id uuid not null references orders on delete cascade,
  payload jsonb not null, status text not null default 'pending' check (status in ('pending','done','failed')),
  attempts int not null default 0, last_error text,
  created_at timestamptz default now(), done_at timestamptz
);

-- ───────── RPCs ─────────
create function recalc_order(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare sub numeric; d numeric; tp numeric;
begin
  select coalesce(sum(unit_price*qty),0) into sub from order_items where order_id = p_id;
  select discount into d from orders where id = p_id;
  select coalesce(value::numeric,0) into tp from settings where key='tax_pct';
  update orders set subtotal = sub,
    tax = round(greatest(sub - d,0) * tp / 100, 2),
    total = greatest(sub - d,0) + round(greatest(sub - d,0) * tp / 100, 2)
  where id = p_id;
end $$;

-- Customers (anon) and staff (captain/cashier/manager/admin) place orders. Prices are computed server-side.
create function place_order(p_outlet uuid, p_table text, p_name text, p_note text, p_items jsonb, p_niro_member text default null)
returns orders language plpgsql security definer set search_path=public as $$
declare o orders; line jsonb; it items; mids uuid[]; mt numeric; mn jsonb; q int; oid uuid := gen_random_uuid(); src text; rl app_role := my_role();
begin
  if auth.uid() is not null and (rl is null or rl = 'kitchen') then raise exception 'Not allowed'; end if;
  src := case when auth.uid() is null then 'qr' when rl = 'captain' then 'captain' else 'pos' end;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Empty order'; end if;
  insert into orders(id, outlet_id, source, table_label, customer_name, note, niro_member_id, created_by)
  values (oid, p_outlet, src, nullif(p_table,''), nullif(p_name,''), nullif(p_note,''), nullif(p_niro_member,''), auth.uid());
  for line in select value from jsonb_array_elements(p_items) loop
    q := greatest((line->>'qty')::int, 1);
    select * into it from items where id = (line->>'item_id')::uuid;
    if not found or not it.available or it.out_of_stock then raise exception '% is not available', coalesce(it.name,'Item'); end if;
    select coalesce(array_agg(x::uuid),'{}') into mids from jsonb_array_elements_text(coalesce(line->'mod_ids','[]'::jsonb)) x;
    select coalesce(sum(m.price_delta),0), coalesce(jsonb_agg(m.name),'[]'::jsonb) into mt, mn
      from modifiers m join modifier_groups g on g.id = m.group_id where m.id = any(mids) and g.item_id = it.id;
    insert into order_items(order_id,item_id,name,qty,unit_price,mods,note)
      values (oid, it.id, it.name, q, it.price + mt, mn, nullif(line->>'note',''));
    update ingredients g set stock = g.stock - r.qty*q from recipe r where r.ingredient_id = g.id and r.item_id = it.id;
  end loop;
  perform recalc_order(oid);
  select * into o from orders where id = oid;
  return o;
end $$;

create function set_status(p_id uuid, p_status text) returns void language plpgsql security definer set search_path=public as $$
begin
  if p_status in ('preparing','ready') and not is_role(array['kitchen','manager','admin']) then raise exception 'Not allowed'; end if;
  if p_status = 'served' and not is_role(array['captain','cashier','manager','admin']) then raise exception 'Not allowed'; end if;
  if p_status not in ('preparing','ready','served') then raise exception 'Use cancel_order to cancel'; end if;
  update orders set status = p_status,
    accepted_at = case when p_status='preparing' then now() else accepted_at end,
    ready_at    = case when p_status='ready' then now() else ready_at end,
    served_at   = case when p_status='served' then now() else served_at end
  where id = p_id and status <> 'cancelled';
end $$;

create function set_discount(p_id uuid, p_amount numeric, p_reason text, p_niro_ref text default null) returns void
language plpgsql security definer set search_path=public as $$
declare sub numeric; cap numeric;
begin
  if not is_role(array['cashier','manager','admin']) then raise exception 'Not allowed'; end if;
  select subtotal into sub from orders where id = p_id;
  select value::numeric into cap from settings where key='max_cashier_discount_pct';
  if my_role() = 'cashier' and p_amount > sub * cap / 100 and p_niro_ref is null then
    raise exception 'Discount above cashier limit: manager approval needed'; end if;
  update orders set discount = least(greatest(p_amount,0), sub), discount_reason = p_reason, niro_reward_ref = p_niro_ref where id = p_id;
  perform recalc_order(p_id);
  insert into audit_log(actor,action,entity,entity_id,detail) values (auth.uid(),'discount','order',p_id::text,jsonb_build_object('amount',p_amount,'reason',p_reason,'niro_ref',p_niro_ref));
end $$;

create function take_payment(p_id uuid, p_method text, p_amount numeric, p_ref text default null) returns orders
language plpgsql security definer set search_path=public as $$
declare o orders; sh uuid; paid_sum numeric; pts int;
begin
  if not is_role(array['cashier','manager','admin']) then raise exception 'Not allowed'; end if;
  select id into sh from shifts where cashier = auth.uid() and closed_at is null order by opened_at desc limit 1;
  if sh is null and my_role() = 'cashier' then raise exception 'Open a shift first'; end if;
  insert into payments(order_id,shift_id,method,amount,ref,created_by) values (p_id,sh,p_method,p_amount,p_ref,auth.uid());
  select coalesce(sum(amount),0) into paid_sum from payments where order_id = p_id;
  select * into o from orders where id = p_id;
  if paid_sum >= o.total and not o.paid then
    update orders set paid = true where id = p_id returning * into o;
    if o.niro_member_id is not null then
      insert into niro_outbox(kind,order_id,payload) values ('earn', o.id,
        jsonb_build_object('member', o.niro_member_id, 'amount', o.total, 'order_no', o.no, 'outlet', o.outlet_id));
    end if;
  end if;
  return o;
end $$;

create function cancel_order(p_id uuid, p_reason text) returns void language plpgsql security definer set search_path=public as $$
declare o orders;
begin
  if not is_role(array['manager','admin']) then raise exception 'Manager approval needed'; end if;
  select * into o from orders where id = p_id;
  if o.status = 'cancelled' then return; end if;
  update ingredients g set stock = g.stock + x.q from (
    select r.ingredient_id, sum(r.qty*oi.qty) q from order_items oi join recipe r on r.item_id = oi.item_id
    where oi.order_id = p_id group by r.ingredient_id) x where g.id = x.ingredient_id;
  update orders set status = 'cancelled' where id = p_id;
  if o.paid and o.niro_member_id is not null then
    insert into niro_outbox(kind,order_id,payload) values ('reverse', p_id, jsonb_build_object('member', o.niro_member_id, 'order_no', o.no));
  end if;
  insert into audit_log(actor,action,entity,entity_id,detail) values (auth.uid(),'cancel','order',p_id::text,jsonb_build_object('reason',p_reason,'was_paid',o.paid));
end $$;

create function open_shift(p_outlet uuid, p_float numeric) returns shifts language plpgsql security definer set search_path=public as $$
declare s shifts;
begin
  if not is_role(array['cashier','manager','admin']) then raise exception 'Not allowed'; end if;
  if exists (select 1 from shifts where cashier = auth.uid() and closed_at is null) then raise exception 'Shift already open'; end if;
  insert into shifts(outlet_id,cashier,opening_float) values (p_outlet,auth.uid(),p_float) returning * into s;
  return s;
end $$;

create function close_shift(p_id uuid, p_counted numeric, p_note text default null) returns shifts language plpgsql security definer set search_path=public as $$
declare s shifts; cash numeric;
begin
  select * into s from shifts where id = p_id and cashier = auth.uid() and closed_at is null;
  if not found then raise exception 'No such open shift'; end if;
  select coalesce(sum(amount),0) into cash from payments where shift_id = p_id and method = 'cash';
  update shifts set closed_at = now(), counted_cash = p_counted, expected_cash = opening_float + cash, note = p_note where id = p_id returning * into s;
  return s;
end $$;

-- Customer order tracking without exposing the orders table.
create function get_order(p_id uuid) returns json language sql security definer set search_path=public as $$
  select json_build_object('no',no,'status',status,'paid',paid,'total',total,'table',table_label) from orders where id = p_id $$;

-- ───────── RLS ─────────
do $$ declare t text; begin
  foreach t in array array['categories','items','modifier_groups','modifiers','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "public read" on %I for select to anon, authenticated using (true)', t);
    execute format($p$create policy "mgmt write" on %I for all to authenticated using (is_role(array['admin','manager'])) with check (is_role(array['admin','manager']))$p$, t);
  end loop;
  foreach t in array array['ingredients','recipe','floor_tables','outlets'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "staff read" on %I for select to authenticated using (my_role() is not null)', t);
    execute format($p$create policy "mgmt write" on %I for all to authenticated using (is_role(array['admin','manager'])) with check (is_role(array['admin','manager']))$p$, t);
  end loop;
  -- orders/order_items/payments/shifts: read-only to staff; ALL writes go through RPCs above.
  foreach t in array array['orders','order_items','payments','shifts'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy "staff read" on %I for select to authenticated using (my_role() is not null)', t);
  end loop;
  alter table staff enable row level security;
  create policy "self or mgmt read" on staff for select to authenticated using (user_id = auth.uid() or is_role(array['admin','manager']));
  create policy "admin write" on staff for all to authenticated using (is_role(array['admin'])) with check (is_role(array['admin']));
  alter table audit_log enable row level security;
  create policy "mgmt read" on audit_log for select to authenticated using (is_role(array['admin','manager']));
  alter table niro_outbox enable row level security;   -- no policies: service role only
end $$;

alter publication supabase_realtime add table orders, order_items, items, ingredients;
