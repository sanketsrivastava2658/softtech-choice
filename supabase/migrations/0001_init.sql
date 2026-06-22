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
