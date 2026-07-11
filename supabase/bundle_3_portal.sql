-- ============================================================
-- bundle_3_portal.sql  — Multi-tenant client portal
-- Run AFTER bundle_1_schema.sql and bundle_2_rbac.sql.
-- Fully additive + idempotent: safe to run more than once, and it never
-- touches or drops any existing table/row. Paste the whole file into the
-- Supabase SQL editor and run once.
--
-- Adds:
--   Phase 1  per-company roles (owner / manager / viewer) on memberships
--   Phase 2  workspace branding (display_name / logo_url / brand_color)
--   Phase 3  leads          (workspace-scoped, RLS)
--   Phase 4  invoices       (workspace-scoped, RLS, read-only for clients)
--   Phase 5  notifications  (workspace + user scoped, RLS)
-- ============================================================

-- ── Phase 1 — per-company roles ──────────────────────────────────────
-- A brand-new enum type (not a value added to the existing user_role), so it
-- can be created AND used in the same run — no split migration needed.
do $$ begin
  create type public.membership_role as enum ('owner', 'manager', 'viewer');
exception when duplicate_object then null; end $$;

alter table public.memberships
  add column if not exists role public.membership_role not null default 'viewer';

-- the current user's role inside a given workspace (null if not a member)
create or replace function public.workspace_role(ws uuid)
returns public.membership_role language sql stable security definer set search_path = public as $$
  select role from public.memberships
  where user_id = auth.uid() and workspace_id = ws;
$$;

-- read access (viewer+) — reuses the existing can_access_workspace() helper.
-- write access (owner/manager) inside a workspace; agency/super admins always pass.
create or replace function public.can_manage_workspace(ws uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_agency_admin()
      or exists (
        select 1 from public.memberships
        where user_id = auth.uid()
          and workspace_id = ws
          and role in ('owner', 'manager')
      );
$$;

-- ── Phase 2 — workspace branding ─────────────────────────────────────
alter table public.workspaces
  add column if not exists display_name text,
  add column if not exists logo_url     text,
  add column if not exists brand_color  text;

-- ── Phase 3 — leads ──────────────────────────────────────────────────
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  campaign_id  text references public.campaigns (id) on delete set null,
  email        text not null,
  full_name    text,
  company      text,
  title        text,
  -- new / contacted / replied / interested / qualified / won / lost
  status       text not null default 'new',
  source       text,
  created_at   timestamptz not null default now(),
  synced_at    timestamptz not null default now()
);
create index if not exists leads_ws_idx on public.leads (workspace_id);

alter table public.leads enable row level security;
drop policy if exists "leads read"       on public.leads;
drop policy if exists "leads manage"     on public.leads;
drop policy if exists "leads admin write" on public.leads;
-- any workspace member (viewer+) can read their leads
create policy "leads read" on public.leads
  for select using (public.can_access_workspace(workspace_id));
-- owner/manager (and admins) can update lead pipeline status
create policy "leads manage" on public.leads
  for update using (public.can_manage_workspace(workspace_id))
             with check (public.can_manage_workspace(workspace_id));
-- super-admin full write (onboarding, manual fixes); sync uses service role
create policy "leads admin write" on public.leads
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Phase 4 — invoices (billing) ─────────────────────────────────────
create table if not exists public.invoices (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  number       text not null,
  amount_cents bigint not null default 0,
  currency     text not null default 'USD',
  -- draft / due / paid / void
  status       text not null default 'due',
  issued_at    date not null default current_date,
  due_at       date,
  paid_at      timestamptz,
  notes        text,
  created_at   timestamptz not null default now()
);
create index if not exists invoices_ws_idx on public.invoices (workspace_id);

alter table public.invoices enable row level security;
drop policy if exists "invoices read"        on public.invoices;
drop policy if exists "invoices admin write" on public.invoices;
-- clients are strictly read-only on billing
create policy "invoices read" on public.invoices
  for select using (public.can_access_workspace(workspace_id));
-- only the agency (super-admin) issues / edits invoices
create policy "invoices admin write" on public.invoices
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ── Phase 5 — notifications ──────────────────────────────────────────
create table if not exists public.notifications (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  -- null = broadcast to the whole workspace; else a single user
  user_id      uuid references public.profiles (id) on delete cascade,
  title        text not null,
  body         text,
  -- info / success / warning / critical
  level        text not null default 'info',
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notifications_ws_idx   on public.notifications (workspace_id);
create index if not exists notifications_user_idx on public.notifications (user_id);

alter table public.notifications enable row level security;
drop policy if exists "notifications read"        on public.notifications;
drop policy if exists "notifications mark read"    on public.notifications;
drop policy if exists "notifications admin write"  on public.notifications;
-- member reads workspace broadcasts + notices addressed to them
create policy "notifications read" on public.notifications
  for select using (
    public.can_access_workspace(workspace_id)
    and (user_id is null or user_id = auth.uid() or public.is_agency_admin())
  );
-- members may mark their own / broadcast notices read (the app only sets read_at)
create policy "notifications mark read" on public.notifications
  for update using (
    public.can_access_workspace(workspace_id)
    and (user_id is null or user_id = auth.uid())
  ) with check (
    public.can_access_workspace(workspace_id)
  );
-- only the agency (super-admin) posts notifications
create policy "notifications admin write" on public.notifications
  for all using (public.is_super_admin()) with check (public.is_super_admin());
