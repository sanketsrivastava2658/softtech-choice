import "server-only";
import { createClient as createSupabaseServer } from "./supabase/server";
import { supabaseConfigured } from "./supabase/env";
import type { Role } from "./auth";
import type { MembershipRole } from "./types";

export interface Member {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  /** Per-company role in this workspace (owner/manager/viewer). */
  membershipRole: MembershipRole;
}

/** Users with access to a workspace (super-admin RLS read). */
export async function listWorkspaceMembers(workspaceId: string): Promise<Member[]> {
  if (!supabaseConfigured()) return [];
  try {
    const sb = await createSupabaseServer();
    const { data } = await sb
      .from("memberships")
      .select("role, profiles!inner(id, email, full_name, role)")
      .eq("workspace_id", workspaceId);
    type Row = {
      role: MembershipRole;
      profiles: { id: string; email: string | null; full_name: string | null; role: Role };
    };
    return ((data as Row[] | null) ?? []).map((m) => ({
      id: m.profiles.id,
      email: m.profiles.email ?? "",
      fullName: m.profiles.full_name ?? "",
      role: m.profiles.role,
      membershipRole: m.role ?? "viewer",
    }));
  } catch {
    return [];
  }
}

/**
 * The signed-in user's per-company role in a workspace. Agency/super admins
 * aren't members but have full authority, so they resolve to "owner". In demo
 * mode (no Supabase) we grant "owner" so client capabilities are explorable.
 */
export async function getMembershipRole(
  workspaceId: string
): Promise<MembershipRole> {
  if (!supabaseConfigured()) return "owner";
  try {
    const sb = await createSupabaseServer();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return "viewer";
    const { data } = await sb
      .from("memberships")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (data?.role) return data.role as MembershipRole;
    // no membership row → an agency/super admin viewing a client → full authority
    return "owner";
  } catch {
    return "viewer";
  }
}

/** Can this per-company role modify data (owner/manager) vs read-only (viewer)? */
export function canManage(role: MembershipRole): boolean {
  return role === "owner" || role === "manager";
}
