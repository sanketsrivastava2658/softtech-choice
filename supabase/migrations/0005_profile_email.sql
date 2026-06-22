-- Surface the user's email on the profile so member/access lists can show it
-- (auth.users.email isn't readable under normal RLS).

alter table public.profiles add column if not exists email text;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end; $$;

-- backfill existing rows
update public.profiles p
   set email = u.email
  from auth.users u
 where p.id = u.id and p.email is null;
