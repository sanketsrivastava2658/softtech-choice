# Deploy — GitHub + Supabase + Vercel

## 1. GitHub (one-time auth, then automated)

```bash
# you (interactive, one time):
~/.local/bin/gh auth login --hostname github.com --git-protocol https --web
# then I run:
gh repo create softtech-choice --public --source=. --remote=origin --push
```

## 2. Supabase

### a. Fill keys
Paste real values into `.env.local` (gitignored):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### b. Run migrations (Supabase → SQL Editor)
Run as **two separate queries**, in order:
1. `supabase/bundle_1_schema.sql`  (tables, RLS, multitenancy)
2. `supabase/bundle_2_rbac.sql`    (super_admin policies, profile email)

> They're split because Postgres needs the new `super_admin` enum value
> committed before the policies that reference it can run.

### c. Create your admin user
Supabase → Authentication → Add user (your email), then SQL Editor:
```sql
update public.profiles set role='super_admin' where email='you@youragency.com';
```

### d. Verify everything
```bash
bun run scripts/check-supabase.mjs
```
Checks: keys → DB connection + tables → auth service → RLS enforcement.

## 3. Vercel

```bash
# you (interactive, one time):
bunx vercel login
# then I run:
bunx vercel deploy --prod --yes
```

### Env vars to set in Vercel (Project → Settings → Environment Variables)
| Var | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://<your-app>.vercel.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | your Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service-role key (server-only — do NOT expose) |
| `SMARTLEAD_API_KEY` | master key (optional) |

### Supabase Auth redirect config (required for login/invite links)
Supabase → Authentication → URL Configuration:
- **Site URL:** `https://<your-app>.vercel.app`
- **Redirect URLs:** add `https://<your-app>.vercel.app/**`

Then redeploy so `NEXT_PUBLIC_APP_URL` takes effect.
