import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "./supabase/server";
import { supabaseConfigured } from "./supabase/env";

export type Role = "super_admin" | "agency_admin" | "client_user";

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

/** Current authenticated user, or null (also null in demo mode). */
export async function getCurrentUser() {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Profile row (role + name) for the signed-in user. Null if none / demo mode. */
export async function getProfile(): Promise<Profile | null> {
  if (!supabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    fullName: data?.full_name ?? user.email ?? "",
    role: (data?.role as Role) ?? "client_user",
  };
}

/**
 * Effective role for UI/route decisions. In demo mode (no Supabase) we treat the
 * viewer as super_admin so the full product — including the admin console — is
 * explorable without credentials.
 */
export async function getEffectiveRole(): Promise<Role> {
  if (!supabaseConfigured()) return "super_admin";
  const p = await getProfile();
  return p?.role ?? "client_user";
}

export async function isSuperAdmin(): Promise<boolean> {
  return (await getEffectiveRole()) === "super_admin";
}

export async function isAdmin(): Promise<boolean> {
  const r = await getEffectiveRole();
  return r === "super_admin" || r === "agency_admin";
}

/** Route guard for the /admin console. Redirects non-admins to their dashboard. */
export async function requireSuperAdmin(): Promise<void> {
  if (!(await isSuperAdmin())) redirect("/analytics");
}
