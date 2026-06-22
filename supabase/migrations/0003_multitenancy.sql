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
