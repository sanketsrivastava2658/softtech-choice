# Softtech Choice — White-label Outbound Console

A white-label layer over **Smartlead**. Your clients log in, create and run cold-
email campaigns, and see only their own data — without ever knowing Smartlead is
underneath. You (the agency) manage everything from a super-admin console.

- **Next.js 16** (App Router) · TypeScript · Tailwind v4
- **Supabase** — auth, roles, multi-tenant data, row-level security
- **Smartlead** — campaigns, sending, inbox, mailboxes (via its white-label
  *client management* API)

Runs in **demo mode** with seeded data and no login until credentials are added.

## Architecture

```
Super admin (you)                 Client user (your customer)
  /admin                            /analytics /campaigns /inbox /accounts
  ├─ onboard client  ──────────────► gets an isolated workspace + login
  │   └─ POST /client/save  → Smartlead client_id + scoped api_key (stored on workspace)
  ├─ connect mailboxes (SMTP/IMAP) → POST /email-accounts/save
  └─ set master Smartlead key       create campaign → wizard orchestrates Smartlead:
                                       create → sequence → schedule → assign senders
                                       → add leads → start
```

- One **master** Smartlead key (yours) does account-level work.
- Each client = a Smartlead **white-label client** with its own scoped key, stored
  on `workspaces.smartlead_api_key`. All that client's reads/writes use that key,
  so isolation is enforced by Smartlead *and* by Supabase RLS.

## Roles (RBAC)

| Role          | Sees / can do                                                        |
|---------------|----------------------------------------------------------------------|
| `super_admin` | Everything: admin console, all clients, mailboxes, credentials       |
| `agency_admin`| All clients (read + switch), no credential management                |
| `client_user` | Only their own workspace — campaigns, inbox, analytics, accounts     |

RLS (`supabase/migrations/0002`, `0004`) enforces this at the database level.

## Run locally (demo mode)

```bash
bun install
bun run dev     # http://localhost:3000
```

No keys needed: seeded data, no login wall, and you're treated as `super_admin`
so the admin console and campaign wizard are fully explorable.

## Go live

### 1. Supabase
1. Create a project at supabase.com.
2. Run the migrations in order in the SQL editor:
   `0001_init` → `0002_rls` → `0003_multitenancy` → `0004_rbac`.
   (0003 and 0004 are separate on purpose — Postgres needs the new `super_admin`
   enum value committed before policies can reference it.)
3. Put the keys in `.env.local` (see `.env.example`): `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
4. Create your own user in Supabase Auth, then promote it:
   `update profiles set role='super_admin' where id='<your-user-id>';`

### 2. Smartlead master key
Sign in as the super admin → **Admin → Credentials** → paste your master Smartlead
API key. It's validated against Smartlead and stored in `app_settings`.
(Alternatively set `SMARTLEAD_API_KEY` in `.env.local`.)

> Client management is a higher-tier Smartlead feature — your master key must have
> it enabled for `/client/save` to work.

### 3. Onboard a client
**Admin → Clients → Onboard a new client.** This:
- creates a Smartlead white-label client (`client_id` + scoped key),
- creates their login user (role `client_user`) — send them a password reset,
- creates their workspace + membership, bound to the Smartlead client.

### 4. Connect mailboxes
**Admin → Mailboxes → Connect a sending mailbox** (SMTP/IMAP). They're created in
your Smartlead master account and can be assigned to clients' campaigns.

### 5. Clients run campaigns
A client logs in → **Email Campaigns → New campaign** → the 6-step wizard
(details → sequence → schedule → senders → leads → review) orchestrates all the
Smartlead calls under their scoped key, then optionally starts sending.

## Logins & access (admin + clients)

There are two kinds of login, both real Supabase Auth users:

**Your admin login (one-time bootstrap)**
1. Create your user: Supabase → Authentication → Add user (or sign up at `/login`).
2. Promote it to super admin — edit and run `supabase/seed.sql`:
   `update profiles set role='super_admin' where email='you@youragency.com';`
3. Log in → you now have the **Admin Console** and see every client.

**Client logins (created on onboarding)**
1. **Admin → Clients → Onboard a new client.** This creates their Smartlead
   client, a `client_user` login, and their workspace — and returns an
   **invite link**.
2. **Copy the invite link and send it to your client.** They open it, set a
   password (`/auth/set-password`), and land in *their* workspace — seeing only
   their own data (enforced by RLS).
3. **More people per client:** open the client (Admin → Clients → Manage) →
   **Users & access → Invite a user**. Existing users get a fresh access link;
   you can re-copy a link any time.

> Invite links use Supabase `generateLink`, so they work whether or not you've
> set up Supabase's email SMTP — you just paste the link to the client yourself.
> `NEXT_PUBLIC_APP_URL` must point at your real domain in production so the links
> resolve correctly.

## Architecture map

| Concern              | Where                                                  |
|----------------------|--------------------------------------------------------|
| Smartlead client     | `src/lib/smartlead.ts` (per-tenant `SmartleadClient`)  |
| Credential resolution| `src/lib/credentials.ts` (master / per-workspace keys) |
| Data seam (live/mock)| `src/lib/data.ts`                                      |
| Auth + roles         | `src/lib/auth.ts`, `src/proxy.ts`, `/login`            |
| Admin console        | `src/app/(app)/admin/*` + `src/components/admin/*`     |
| Campaign wizard      | `src/components/campaigns/CampaignWizard.tsx` + `campaigns/actions.ts` |
| Onboarding actions   | `src/app/(app)/admin/actions.ts`                       |
| DB schema + RLS      | `supabase/migrations/0001…0004`                        |

## Build

```bash
bun run build
```

## Next passes
- Smartlead → Supabase **sync job** to fill `engagement_daily` (the trend chart)
  and cache campaign/inbox data per client.
- Fields marked `VERIFY` in `src/lib/smartlead.ts` should be confirmed against a
  live API response.
- Mailbox ↔ client assignment UI (the API call exists; expose a picker).
- Password-reset / invite email on client onboarding.
