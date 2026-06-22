-- ============================================================
-- 0001_init.sql
-- ============================================================
-- Outbound console — core schema (multi-tenant: agency → clients)
-- Run against your Supabase project (SQL editor or `supabase db push`).

-- ── identity & tenancy ───────────────────────────────────────────────
create table if not exists public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  -- Smartlead credentials are stored per client workspace (encrypt at rest /
  -- use Vault in production); the sync job reads them to pull that client's data
  smartlead_api_key text,
  created_at  timestamptz not null default now()
);

create type public.user_role as enum ('agency_admin', 'client_user');

-- one row per auth user; agency_admins see every workspace, client_users
-- see only the workspaces they're a member of
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  role       public.user_role not null default 'client_user',
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (user_id, workspace_id)
);

-- ── cached Smartlead data (per workspace) ────────────────────────────
create type public.campaign_status as enum
  ('active', 'paused', 'completed', 'draft', 'warming');

create table if not exists public.campaigns (
  id            text primary key,                       -- Smartlead campaign id
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  name          text not null,
  status        public.campaign_status not null default 'draft',
  lead_count    int  not null default 0,
  sent_count    int  not null default 0,
  open_rate     numeric not null default 0,
  reply_rate    numeric not null default 0,
  positive_reply_rate numeric not null default 0,
  bounce_rate   numeric not null default 0,
  created_at    timestamptz not null default now(),
  synced_at     timestamptz not null default now()
);
create index if not exists campaigns_ws_idx on public.campaigns (workspace_id);

-- daily engagement snapshots power the time-series chart
create table if not exists public.engagement_daily (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  campaign_id  text references public.campaigns (id) on delete cascade,
  day          date not null,
  sent         int not null default 0,
  opened       int not null default 0,
  replied      int not null default 0,
  bounced      int not null default 0,
  primary key (workspace_id, campaign_id, day)
);

create type public.reply_category as enum
  ('interested','meeting_request','not_interested','neutral',
   'out_of_office','wrong_person','do_not_contact');

create table if not exists public.inbox_messages (
  id           text primary key,
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  campaign_id  text references public.campaigns (id) on delete set null,
  lead_email   text not null,
  lead_name    text,
  lead_company text,
  subject      text,
  body         text,
  category     public.reply_category not null default 'neutral',
  read         boolean not null default false,
  received_at  timestamptz not null default now()
);
create index if not exists inbox_ws_idx on public.inbox_messages (workspace_id);

create table if not exists public.email_accounts (
  id            text primary key,
  workspace_id  uuid not null references public.workspaces (id) on delete cascade,
  from_email    text not null,
  from_name     text,
  provider      text,
  status        text not null default 'active',
  warmup_status text not null default 'active',
  warmup_reputation int not null default 0,
  daily_limit   int not null default 0,
  sent_today    int not null default 0,
  deliverability_score int not null default 0,
  synced_at     timestamptz not null default now()
);
create index if not exists accounts_ws_idx on public.email_accounts (workspace_id);

-- auto-create a profile row when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 0002_rls.sql
-- ============================================================
-- Row-level security: client_users see only workspaces they belong to;
-- agency_admins see everything. Enable RLS on every tenant table.

alter table public.workspaces      enable row level security;
alter table public.profiles        enable row level security;
alter table public.memberships     enable row level security;
alter table public.campaigns       enable row level security;
alter table public.engagement_daily enable row level security;
alter table public.inbox_messages  enable row level security;
alter table public.email_accounts  enable row level security;

-- helper: is the current user an agency admin?
create or replace function public.is_agency_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'agency_admin'
  );
$$;

-- helper: can the current user access this workspace?
create or replace function public.can_access_workspace(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_agency_admin()
      or exists (
        select 1 from public.memberships
        where user_id = auth.uid() and workspace_id = ws
      );
$$;

-- profiles: a user reads their own row; admins read all
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_agency_admin());
create policy "profiles self update" on public.profiles
  for update using (id = auth.uid());

-- memberships: visible to the member and to admins
create policy "memberships read" on public.memberships
  for select using (user_id = auth.uid() or public.is_agency_admin());

-- workspaces: members + admins
create policy "workspaces read" on public.workspaces
  for select using (public.can_access_workspace(id));
create policy "workspaces admin write" on public.workspaces
  for all using (public.is_agency_admin()) with check (public.is_agency_admin());

-- cached data tables: read gated by workspace access; writes are admin/service-role
create policy "campaigns read" on public.campaigns
  for select using (public.can_access_workspace(workspace_id));
create policy "engagement read" on public.engagement_daily
  for select using (public.can_access_workspace(workspace_id));
create policy "inbox read" on public.inbox_messages
  for select using (public.can_access_workspace(workspace_id));
create policy "accounts read" on public.email_accounts
  for select using (public.can_access_workspace(workspace_id));

-- NOTE: the sync job writes cached data using the service-role key, which
-- bypasses RLS. No client-facing write policies are granted on cached tables.

-- ============================================================
-- 0003_multitenancy.sql
-- ============================================================
-- Multi-tenancy + white-label Smartlead binding + super-admin credentials.
-- (Policies that reference the new 'super_admin' enum value live in 0004 — a new
--  enum value must be committed before it can be used.)

-- top-level role for the agency owner / operators
alter type public.user_role add value if not exists 'super_admin';

-- workspace ← Smartlead client binding + lifecycle + primary sending domain
alter table public.workspaces
  add column if not exists smartlead_client_id bigint,
  add column if not exists status text not null default 'active',
  add column if not exists primary_domain text;
-- (smartlead_api_key already exists from 0001_init.sql)

-- singleton settings row holding the agency MASTER Smartlead key (super-admin only)
create table if not exists public.app_settings (
  id                  int primary key default 1,
  smartlead_master_key text,
  smartlead_base_url   text default 'https://server.smartlead.ai/api/v1',
  updated_at          timestamptz not null default now(),
  constraint app_settings_singleton check (id = 1)
);
insert into public.app_settings (id) values (1) on conflict do nothing;

-- agency-provisioned sending domains, assignable to a client workspace
create table if not exists public.domains (
  id           uuid primary key default gen_random_uuid(),
  domain       text not null unique,
  workspace_id uuid references public.workspaces (id) on delete set null,
  status       text not null default 'active',
  created_at   timestamptz not null default now()
);
create index if not exists domains_ws_idx on public.domains (workspace_id);

-- link cached mailboxes back to their Smartlead account id
alter table public.email_accounts
  add column if not exists smartlead_account_id bigint;

