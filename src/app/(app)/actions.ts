"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

/**
 * Client-portal mutations. Unlike the admin actions these run through the
 * RLS-scoped server client (the user's own session) — so the database, not the
 * app, is the source of truth on who may write. A viewer's lead update simply
 * affects 0 rows; owners/managers pass the "leads manage" policy.
 */

const LEAD_STATUSES = [
  "new", "contacted", "replied", "interested", "qualified", "won", "lost",
] as const;

export async function updateLeadStatus(formData: FormData): Promise<void> {
  if (!supabaseConfigured()) return;
  const id = String(formData.get("lead_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !(LEAD_STATUSES as readonly string[]).includes(status)) return;

  const sb = await createClient();
  await sb.from("leads").update({ status }).eq("id", id);
  revalidatePath("/leads");
}

export async function markNotificationRead(formData: FormData): Promise<void> {
  if (!supabaseConfigured()) return;
  const id = String(formData.get("notification_id") ?? "");
  if (!id) return;

  const sb = await createClient();
  await sb.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
  revalidatePath("/notifications");
}

export async function markAllNotificationsRead(formData: FormData): Promise<void> {
  if (!supabaseConfigured()) return;
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) return;

  const sb = await createClient();
  await sb
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("workspace_id", workspaceId)
    .is("read_at", null);
  revalidatePath("/notifications");
}
