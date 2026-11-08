-- =====================================================================
-- AEC Thesis & Assignment Platform: database schema (Week 1)
-- Run once in Supabase: SQL Editor > New query > paste > Run.
-- Covers PRD section 11, the security rules in sections 6 and 7,
-- guest orders, the 50% deposit rule and one-use MoMo transaction IDs.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Types ----------------------------------------------------
do $$ begin
  create type user_role as enum ('client', 'admin', 'writer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type order_status as enum (
    'awaiting_quote', 'quote_sent', 'awaiting_deposit', 'in_progress',
    'ready_for_preview', 'payment_submitted', 'payment_rejected',
    'delivered', 'revision_requested', 'closed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_kind as enum ('deposit', 'balance');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('submitted', 'confirmed', 'rejected');
exception when duplicate_object then null; end $$;

-- ---------- Profiles (one per signed-up user) -------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  full_name     text,
  email         text,
  whatsapp      text,
  institution   text,
  programme     text,
  level         text,
  role          user_role not null default 'client',
  referral_code text unique default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, whatsapp)
  values (new.id, new.email,
          new.raw_user_meta_data ->> 'full_name',
          new.raw_user_meta_data ->> 'whatsapp')
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ---------- Leads (consultation requests) -----------------------------
create sequence if not exists public.lead_seq start 1;

create table if not exists public.leads (
  id          bigint primary key default nextval('public.lead_seq'),
  ref         text unique,
  name        text not null,
  whatsapp    text,
  level       text,
  institution text,
  service     text,
  message     text,
  source_page text,
  status      text not null default 'new' check (status in ('new', 'contacted', 'converted', 'closed')),
  created_at  timestamptz not null default now()
);

create or replace function public.set_lead_ref()
returns trigger language plpgsql as $$
begin new.ref := 'L-' || lpad(new.id::text, 4, '0'); return new; end $$;

drop trigger if exists leads_ref on public.leads;
create trigger leads_ref before insert on public.leads
  for each row execute function public.set_lead_ref();

-- ---------- Services catalogue ----------------------------------------
create table if not exists public.services (
  id             bigint generated always as identity primary key,
  slug           text unique not null,
  name           text not null,
  category       text not null check (category in ('thesis', 'proposal', 'analysis', 'chapters', 'assignment', 'presentation')),
  starting_price numeric(10,2),
  active         boolean not null default true,
  sort           int not null default 0
);

-- ---------- Orders -----------------------------------------------------
create sequence if not exists public.order_seq start 1;

create table if not exists public.orders (
  id                uuid primary key default gen_random_uuid(),
  order_number      text unique not null
                    default ('AEC-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.order_seq')::text, 4, '0')),
  client_id         uuid references public.profiles (id) on delete set null,
  guest_name        text,
  guest_email       text,
  guest_whatsapp    text,
  access_token      uuid not null default gen_random_uuid(),  -- private link for guests
  service_id        bigint references public.services (id),
  topic             text not null,
  level             text,
  institution       text,
  programme         text,
  supervisor        text,
  method            text,
  referencing_style text,
  length_text       text,
  deadline          date,
  notes             text,
  quoted_price      numeric(10,2),
  deposit_percent   int not null default 50 check (deposit_percent between 0 and 100),
  amount_paid       numeric(10,2) not null default 0,
  delivery_date     date,
  status            order_status not null default 'awaiting_quote',
  admin_notes       text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint orders_has_owner check (client_id is not null or (guest_name is not null and guest_whatsapp is not null))
);

create index if not exists orders_client_idx on public.orders (client_id);
create index if not exists orders_status_idx on public.orders (status);

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists orders_touch on public.orders;
create trigger orders_touch before update on public.orders
  for each row execute function public.touch_updated_at();

-- ---------- Files the client uploads ----------------------------------
create table if not exists public.order_files (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references public.orders (id) on delete cascade,
  uploaded_by  uuid references public.profiles (id),
  purpose      text not null default 'other' check (purpose in ('guideline', 'comment', 'data', 'draft', 'other')),
  file_name    text not null,
  storage_path text not null,
  size_bytes   bigint,
  created_at   timestamptz not null default now()
);

-- ---------- Deliverables (the finished work) --------------------------
create table if not exists public.deliverables (
  id                 uuid primary key default gen_random_uuid(),
  order_id           uuid not null references public.orders (id) on delete cascade,
  version            int not null default 1,
  label              text not null default 'Full work',
  original_path      text not null,           -- private bucket, never public
  preview_paths      text[] not null default '{}',
  preview_page_count int not null default 0,
  locked             boolean not null default true,
  download_count     int not null default 0,
  download_limit     int not null default 5,
  created_at         timestamptz not null default now()
);

-- ---------- Payments ----------------------------------------------------
create table if not exists public.payments (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  kind            payment_kind not null,
  amount          numeric(10,2) not null check (amount > 0),
  txn_id          text not null,
  sender_number   text not null,
  sender_name     text not null,
  screenshot_path text,
  status          payment_status not null default 'submitted',
  reason          text,
  decided_by      uuid references public.profiles (id),
  decided_at      timestamptz,
  created_at      timestamptz not null default now()
);
-- A MoMo transaction ID can be used once only, across all orders.
create unique index if not exists payments_txn_unique on public.payments (lower(trim(txn_id)));

-- ---------- Messages, coupons, audit log --------------------------------
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  order_id        uuid not null references public.orders (id) on delete cascade,
  sender_id       uuid references public.profiles (id),
  from_admin      boolean not null default false,
  body            text not null,
  attachment_path text,
  created_at      timestamptz not null default now()
);

create table if not exists public.coupons (
  id         bigint generated always as identity primary key,
  code       text unique not null,
  kind       text not null check (kind in ('percent', 'fixed')),
  value      numeric(10,2) not null,
  max_uses   int,
  used       int not null default 0,
  expires_at timestamptz,
  owner_id   uuid references public.profiles (id),
  active     boolean not null default true
);

create table if not exists public.audit_log (
  id         bigint generated always as identity primary key,
  actor_id   uuid,
  action     text not null,
  target     text,
  detail     jsonb,
  ip         text,
  created_at timestamptz not null default now()
);

-- =====================================================================
-- Row-level security: clients see only their own rows; admin sees all.
-- Guests never touch tables directly; they use the functions below.
-- =====================================================================
alter table public.profiles     enable row level security;
alter table public.leads        enable row level security;
alter table public.services     enable row level security;
alter table public.orders       enable row level security;
alter table public.order_files  enable row level security;
alter table public.deliverables enable row level security;
alter table public.payments     enable row level security;
alter table public.messages     enable row level security;
alter table public.coupons      enable row level security;
alter table public.audit_log    enable row level security;

-- Profiles: own row, admin all. Users may edit contact fields only, never role.
drop policy if exists profiles_self_read on public.profiles;
create policy profiles_self_read on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists profiles_self_update on public.profiles;
create policy profiles_self_update on public.profiles for update using (id = auth.uid() or public.is_admin());
revoke update on public.profiles from authenticated;
grant update (full_name, whatsapp, institution, programme, level) on public.profiles to authenticated;

-- Leads: admin only (public inserts go through create_lead()).
drop policy if exists leads_admin on public.leads;
create policy leads_admin on public.leads for all using (public.is_admin()) with check (public.is_admin());

-- Services: anyone can read active ones; admin manages.
drop policy if exists services_read on public.services;
create policy services_read on public.services for select using (active or public.is_admin());
drop policy if exists services_admin on public.services;
create policy services_admin on public.services for all using (public.is_admin()) with check (public.is_admin());

-- Orders: owner reads; admin does everything. Clients change orders only through functions.
drop policy if exists orders_owner_read on public.orders;
create policy orders_owner_read on public.orders for select using (client_id = auth.uid() or public.is_admin());
drop policy if exists orders_admin on public.orders;
create policy orders_admin on public.orders for all using (public.is_admin()) with check (public.is_admin());

-- Child tables follow the order's owner.
drop policy if exists files_owner on public.order_files;
create policy files_owner on public.order_files for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid()));
drop policy if exists files_admin on public.order_files;
create policy files_admin on public.order_files for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists deliverables_owner on public.deliverables;
create policy deliverables_owner on public.deliverables for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid()));
drop policy if exists deliverables_admin on public.deliverables;
create policy deliverables_admin on public.deliverables for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists payments_owner on public.payments;
create policy payments_owner on public.payments for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid()));
drop policy if exists payments_admin on public.payments;
create policy payments_admin on public.payments for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists messages_owner on public.messages;
create policy messages_owner on public.messages for select using (
  public.is_admin() or exists (select 1 from public.orders o where o.id = order_id and o.client_id = auth.uid()));
drop policy if exists messages_admin on public.messages;
create policy messages_admin on public.messages for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists coupons_admin on public.coupons;
create policy coupons_admin on public.coupons for all using (public.is_admin()) with check (public.is_admin());
drop policy if exists audit_admin on public.audit_log;
create policy audit_admin on public.audit_log for select using (public.is_admin());

-- =====================================================================
-- Functions the website calls. They run with elevated rights but check
-- the caller (owner, guest token or admin) themselves.
-- =====================================================================

-- Consultation form: save a lead and return its reference for WhatsApp.
create or replace function public.create_lead(
  p_name text, p_whatsapp text, p_level text, p_institution text,
  p_service text, p_message text, p_source text)
returns text language plpgsql security definer set search_path = public as $$
declare v_ref text;
begin
  if coalesce(trim(p_name), '') = '' then raise exception 'Name is required'; end if;
  insert into leads (name, whatsapp, level, institution, service, message, source_page)
  values (left(p_name, 120), left(p_whatsapp, 30), left(p_level, 60), left(p_institution, 120),
          left(p_service, 120), left(p_message, 1000), left(p_source, 120))
  returning ref into v_ref;
  return v_ref;
end $$;

-- New order, by a signed-in client or a guest. Returns number + private token.
create or replace function public.create_order(
  p_service_slug text, p_topic text, p_level text, p_institution text, p_programme text,
  p_supervisor text, p_method text, p_referencing text, p_length text,
  p_deadline date, p_notes text,
  p_guest_name text default null, p_guest_email text default null, p_guest_whatsapp text default null)
returns table (order_id uuid, order_number text, access_token uuid)
language plpgsql security definer set search_path = public as $$
declare v_service bigint; v_uid uuid := auth.uid();
begin
  select id into v_service from services where slug = p_service_slug and active;
  if v_uid is null and (coalesce(trim(p_guest_name), '') = '' or coalesce(trim(p_guest_whatsapp), '') = '') then
    raise exception 'Guests must give a name and WhatsApp number';
  end if;
  return query
  insert into orders as o (client_id, guest_name, guest_email, guest_whatsapp, service_id, topic, level,
                           institution, programme, supervisor, method, referencing_style, length_text, deadline, notes)
  values (v_uid,
          case when v_uid is null then p_guest_name end,
          case when v_uid is null then p_guest_email end,
          case when v_uid is null then p_guest_whatsapp end,
          v_service, p_topic, p_level, p_institution, p_programme, p_supervisor, p_method,
          p_referencing, p_length, p_deadline, p_notes)
  returning o.id, o.order_number, o.access_token;
end $$;

-- Internal check: may the caller act on this order? (owner, guest token or admin)
create or replace function public.can_access_order(p_order uuid, p_token uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from orders o
    where o.id = p_order
      and (public.is_admin() or (auth.uid() is not null and o.client_id = auth.uid())
           or (p_token is not null and o.access_token = p_token)));
$$;

-- Guest view of an order through the private link.
create or replace function public.get_order_by_token(p_order_number text, p_token uuid)
returns setof public.orders language sql stable security definer set search_path = public as $$
  select * from orders where order_number = p_order_number and access_token = p_token;
$$;

-- Client accepts the quote: moves to awaiting deposit (50% rule).
create or replace function public.accept_quote(p_order uuid, p_token uuid default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.can_access_order(p_order, p_token) then raise exception 'Not allowed'; end if;
  update orders set status = case when deposit_percent > 0 then 'awaiting_deposit'::order_status else 'in_progress'::order_status end
  where id = p_order and status = 'quote_sent';
  if not found then raise exception 'This order has no open quote'; end if;
end $$;

-- "I have paid": records the MoMo details for the admin to check.
create or replace function public.submit_payment(
  p_order uuid, p_kind payment_kind, p_amount numeric, p_txn_id text,
  p_sender_number text, p_sender_name text, p_screenshot_path text default null, p_token uuid default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_status order_status;
begin
  if not public.can_access_order(p_order, p_token) then raise exception 'Not allowed'; end if;
  select status into v_status from orders where id = p_order;
  if p_kind = 'deposit' and v_status not in ('awaiting_deposit', 'payment_rejected') then
    raise exception 'No deposit is due on this order';
  end if;
  if p_kind = 'balance' and v_status not in ('ready_for_preview', 'payment_rejected') then
    raise exception 'The balance is due once your work is ready for preview';
  end if;
  if exists (select 1 from payments where lower(trim(txn_id)) = lower(trim(p_txn_id))) then
    raise exception 'This transaction ID has already been used';
  end if;
  insert into payments (order_id, kind, amount, txn_id, sender_number, sender_name, screenshot_path)
  values (p_order, p_kind, p_amount, trim(p_txn_id), p_sender_number, p_sender_name, p_screenshot_path)
  returning id into v_id;
  update orders set status = 'payment_submitted' where id = p_order;
  return v_id;
end $$;

-- Admin confirms a payment after checking the MoMo wallet or network SMS.
create or replace function public.confirm_payment(p_payment uuid)
returns void language plpgsql security definer set search_path = public as $$
declare p record; o record;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  select * into p from payments where id = p_payment and status = 'submitted' for update;
  if not found then raise exception 'Payment not found or already decided'; end if;
  update payments set status = 'confirmed', decided_by = auth.uid(), decided_at = now() where id = p_payment;
  update orders set amount_paid = amount_paid + p.amount where id = p.order_id returning * into o;

  if p.kind = 'deposit' then
    update orders set status = 'in_progress' where id = o.id;
  elsif o.quoted_price is not null and o.amount_paid >= o.quoted_price then
    update orders set status = 'delivered' where id = o.id;
    update deliverables set locked = false where order_id = o.id;   -- unlock downloads
  else
    update orders set status = 'ready_for_preview' where id = o.id;  -- part paid, still locked
  end if;

  insert into audit_log (actor_id, action, target, detail)
  values (auth.uid(), 'payment_confirmed', o.order_number, jsonb_build_object('payment', p_payment, 'amount', p.amount, 'txn', p.txn_id));
end $$;

-- Admin rejects a payment, with a reason the client will see.
create or replace function public.reject_payment(p_payment uuid, p_reason text)
returns void language plpgsql security definer set search_path = public as $$
declare v_order uuid;
begin
  if not public.is_admin() then raise exception 'Admin only'; end if;
  if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason'; end if;
  update payments set status = 'rejected', reason = p_reason, decided_by = auth.uid(), decided_at = now()
  where id = p_payment and status = 'submitted' returning order_id into v_order;
  if v_order is null then raise exception 'Payment not found or already decided'; end if;
  update orders set status = 'payment_rejected' where id = v_order;
  insert into audit_log (actor_id, action, target, detail)
  values (auth.uid(), 'payment_rejected', v_order::text, jsonb_build_object('payment', p_payment, 'reason', p_reason));
end $$;

grant execute on function public.create_lead(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, text, text, text, text, date, text, text, text, text) to anon, authenticated;
grant execute on function public.get_order_by_token(text, uuid) to anon, authenticated;
grant execute on function public.accept_quote(uuid, uuid) to anon, authenticated;
grant execute on function public.submit_payment(uuid, payment_kind, numeric, text, text, text, text, uuid) to anon, authenticated;
grant execute on function public.confirm_payment(uuid) to authenticated;
grant execute on function public.reject_payment(uuid, text) to authenticated;
revoke execute on function public.can_access_order(uuid, uuid) from anon, authenticated;

-- =====================================================================
-- Private storage buckets. Nothing here is public: files are shared
-- only through short-lived signed links made by Netlify Functions.
-- =====================================================================
insert into storage.buckets (id, name, public) values
  ('client-uploads', 'client-uploads', false),
  ('deliverables',   'deliverables',   false),
  ('previews',       'previews',       false),
  ('payment-proofs', 'payment-proofs', false)
on conflict (id) do nothing;

drop policy if exists storage_admin_all on storage.objects;
create policy storage_admin_all on storage.objects for all
  using (public.is_admin()) with check (public.is_admin());

-- =====================================================================
-- Starter services (prices from the PRD; edit any time).
-- =====================================================================
insert into public.services (slug, name, category, starting_price, sort) values
  ('thesis',        'Thesis, Long Essay and Dissertation', 'thesis',       7000, 1),
  ('proposal',      'Research Proposal',                   'proposal',     null, 2),
  ('analysis',      'Data Analysis',                       'analysis',     null, 3),
  ('chapters',      'Single Chapter or Corrections',       'chapters',     null, 4),
  ('assignments',   'Assignment',                          'assignment',   null, 5),
  ('presentations', 'Presentation or Editing',             'presentation', null, 6)
on conflict (slug) do nothing;

-- =====================================================================
-- LAST STEP, after you sign up on the site once: make yourself admin.
--   update public.profiles set role = 'admin' where email = 'YOUR-EMAIL';
-- =====================================================================
