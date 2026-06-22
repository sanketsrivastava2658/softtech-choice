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
