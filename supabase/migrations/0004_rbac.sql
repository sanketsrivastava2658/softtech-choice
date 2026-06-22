-- RBAC policies for super_admin + new tenant tables.
-- super_admin = full access everywhere (manage clients, data, credentials).
-- client_user = strictly their own workspace(s).

-- super-admin predicate
create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

-- treat super_admin as an admin everywhere the old helper is used
create or replace function public.is_agency_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('agency_admin', 'super_admin')
  );
$$;

-- app_settings: super-admin only (holds the master Smartlead key)
alter table public.app_settings enable row level security;
create policy "settings super admin" on public.app_settings
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- domains: super-admin manages; workspace members can see their assigned domains
alter table public.domains enable row level security;
create policy "domains admin write" on public.domains
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "domains member read" on public.domains
  for select using (
    public.is_super_admin() or public.can_access_workspace(workspace_id)
  );

-- super-admin can write tenant tables directly (onboarding, manual fixes);
-- the sync job still uses the service-role key for bulk cache writes.
create policy "workspaces super admin write" on public.workspaces
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "profiles super admin" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "memberships super admin" on public.memberships
  for all using (public.is_super_admin()) with check (public.is_super_admin());
create policy "email_accounts super admin" on public.email_accounts
  for all using (public.is_super_admin()) with check (public.is_super_admin());
