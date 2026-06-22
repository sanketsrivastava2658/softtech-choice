import "server-only";
import { createClient as createSupabaseServer } from "./supabase/server";
import { supabaseConfigured } from "./supabase/env";
import type { Role } from "./auth";

export interface Member {
  id: string;
  email: string;
  fullName: string;
  role: Role;
}

/** Users with access to a workspace (super-admin RLS read). */
export async function listWorkspaceMembers(workspaceId: string): Promise<Member[]> {
  if (!supabaseConfigured()) return [];
  try {
    const sb = await createSupabaseServer();
    const { data } = await sb
      .from("memberships")
      .select("profiles!inner(id, email, full_name, role)")
      .eq("workspace_id", workspaceId);
    type Row = { profiles: { id: string; email: string | null; full_name: string | null; role: Role } };
    return ((data as Row[] | null) ?? []).map((m) => ({
      id: m.profiles.id,
      email: m.profiles.email ?? "",
      fullName: m.profiles.full_name ?? "",
      role: m.profiles.role,
    }));
  } catch {
    return [];
  }
}
