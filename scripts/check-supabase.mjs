// Supabase health check — run AFTER filling .env.local and running the migrations.
//   bun run scripts/check-supabase.mjs
//
// Verifies, in order: keys present → DB connection + tables (migrations applied)
// → auth service reachable → RLS actually enforcing (probe row visible to the
// service role but NOT to an anonymous client).

import { readFileSync, existsSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const G = "\x1b[32m", R = "\x1b[31m", D = "\x1b[2m", X = "\x1b[0m";
const ok = (s) => console.log(`${G}✓${X} ${s}`);
const bad = (s) => console.log(`${R}✗${X} ${s}`);
const note = (s) => console.log(`${D}    ${s}${X}`);

// load .env.local without extra deps
if (existsSync(".env.local")) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("\nSupabase health check\n=====================");
let fail = 0;

if (!url || !anon || !service) {
  bad("Missing keys in .env.local");
  note("Need NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
ok("All three keys present in .env.local");
if (service === anon) {
  bad("SERVICE_ROLE_KEY equals ANON_KEY — wrong value for the service role");
  fail++;
}

const admin = createClient(url, service, { auth: { persistSession: false } });
const guest = createClient(url, anon, { auth: { persistSession: false } });

// 1) DB connection + migrations
const expected = [
  "workspaces", "profiles", "memberships", "campaigns",
  "email_accounts", "app_settings", "domains",
];
let tablesOk = true;
for (const t of expected) {
  const { error } = await admin.from(t).select("*", { count: "exact", head: true });
  if (error) { tablesOk = false; note(`missing/blocked: ${t} (${error.message})`); }
}
if (tablesOk) ok(`Database connected — all ${expected.length} tables present (migrations applied)`);
else { bad("Some tables missing — run the migration bundles in the Supabase SQL editor"); fail++; }

// 2) Auth service
try {
  const r = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: anon } });
  if (r.ok) ok("Auth service reachable (GoTrue 200)");
  else { bad(`Auth endpoint returned ${r.status}`); fail++; }
} catch (e) { bad(`Auth endpoint error: ${String(e)}`); fail++; }

// 3) RLS proof
if (tablesOk) {
  const slug = "__rls_probe__";
  await admin.from("workspaces").delete().eq("slug", slug);
  const { error: insErr } = await admin.from("workspaces").insert({ name: "RLS probe", slug });
  if (insErr) { bad(`Probe insert failed: ${insErr.message}`); fail++; }
  else {
    const { data: guestRows } = await guest.from("workspaces").select("id").eq("slug", slug);
    const { data: adminRows } = await admin.from("workspaces").select("id").eq("slug", slug);
    const g = guestRows?.length ?? 0;
    const a = adminRows?.length ?? 0;
    if (a >= 1 && g === 0) ok("RLS enforced — service role sees the probe row, anonymous client sees 0");
    else { bad(`RLS NOT enforcing — anonymous client saw ${g} row(s). Enable RLS + apply policies (0002/0004).`); fail++; }
    await admin.from("workspaces").delete().eq("slug", slug);
  }
}

console.log("");
if (fail === 0) ok("All checks passed — Supabase is wired correctly.");
else bad(`${fail} check(s) failed — see above.`);
process.exit(fail === 0 ? 0 : 1);
