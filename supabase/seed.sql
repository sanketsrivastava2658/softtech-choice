-- Bootstrap your first super admin.
--
-- 1. Create your own user first: Supabase Dashboard → Authentication → Add user
--    (or sign up through /login once Supabase is connected). The signup trigger
--    creates a matching public.profiles row (default role = client_user).
-- 2. Promote that user to super_admin by email:

update public.profiles
   set role = 'super_admin'
 where email = 'you@youragency.com';   -- ← change to YOUR admin email

-- Verify:
--   select email, role from public.profiles order by role;
--
-- After this, log in as that user → you'll see the Admin Console and can
-- onboard clients (each gets a client_user login + invite link).
