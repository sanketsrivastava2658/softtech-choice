"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/supabase/env";
import { masterClient, getMasterCreds } from "@/lib/credentials";
import { SmartleadClient, DEFAULT_BASE_URL } from "@/lib/smartlead";
import { requireSuperAdmin } from "@/lib/auth";
import { APP_URL } from "@/lib/constants";

export interface ActionState {
  ok?: boolean;
  error?: string;
  message?: string;
  /** A copyable invite / access link, when an action produced one. */
  link?: string;
}

const CONFIRM_REDIRECT = `${APP_URL}/auth/confirm?next=/auth/set-password`;

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

/**
 * Onboard a client end-to-end:
 *   1. create a Smartlead white-label client  (→ client_id + scoped api_key)
 *   2. create their login user + profile (role: client_user)
 *   3. create the workspace bound to the Smartlead client + a membership
 */
export async function onboardClient(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const domain = String(formData.get("domain") ?? "").trim();
  if (!name || !email) return { error: "Client name and login email are required." };

  if (!supabaseConfigured()) {
    return { error: "Connect Supabase first (see Settings) to persist clients." };
  }
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const master = await masterClient();
  if (!master) {
    return { error: "Set the master Smartlead API key in Settings before onboarding." };
  }

  // 1) Smartlead white-label client
  let smartleadClientId: number | null = null;
  let smartleadApiKey: string | null = null;
  try {
    const res = await master.createClient({ name, email });
    smartleadClientId = res.id || null;
    smartleadApiKey = res.apiKey || null;
  } catch (e) {
    return { error: `Smartlead client creation failed: ${(e as Error).message}` };
  }

  // 2) create the login + an invite link (profile row added by the signup trigger)
  const { data: invite, error: inviteErr } = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { data: { full_name: name }, redirectTo: CONFIRM_REDIRECT },
  });
  if (inviteErr || !invite.user) {
    return { error: `Login creation failed: ${inviteErr?.message ?? "unknown"}` };
  }
  await admin.from("profiles").update({ role: "client_user", full_name: name }).eq("id", invite.user.id);
  const inviteLink = invite.properties?.action_link ?? "";

  // 3) workspace + membership
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .insert({
      name,
      slug: slugify(name) || invite.user.id.slice(0, 8),
      smartlead_client_id: smartleadClientId,
      smartlead_api_key: smartleadApiKey,
      primary_domain: domain || null,
      status: "active",
    })
    .select("id")
    .single();
  if (wsErr || !ws) return { error: `Workspace creation failed: ${wsErr?.message}` };

  // the first user of a client company is its Owner
  await admin
    .from("memberships")
    .insert({ user_id: invite.user.id, workspace_id: ws.id, role: "owner" });

  revalidatePath("/admin");
  return {
    ok: true,
    link: inviteLink,
    message: `Onboarded ${name}. Send ${email} this link to set a password and log in:`,
  };
}

const MEMBERSHIP_ROLES = ["owner", "manager", "viewer"] as const;
type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];
function coerceRole(v: FormDataEntryValue | null): MembershipRole {
  const s = String(v ?? "viewer");
  return (MEMBERSHIP_ROLES as readonly string[]).includes(s)
    ? (s as MembershipRole)
    : "viewer";
}

/** Invite an (additional) user into an existing client workspace. */
export async function inviteUserToWorkspace(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
  const role = coerceRole(formData.get("role"));
  if (!email || !workspaceId) return { error: "Email is required." };
  if (!supabaseConfigured()) return { error: "Connect Supabase first." };
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  // invite a new user; if they already exist, fall back to a recovery link
  let g = await admin.auth.admin.generateLink({
    type: "invite",
    email,
    options: { redirectTo: CONFIRM_REDIRECT },
  });
  if (g.error && /registered|already|exists/i.test(g.error.message)) {
    g = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: CONFIRM_REDIRECT },
    });
  }
  if (g.error || !g.data.user) return { error: `Invite failed: ${g.error?.message}` };

  await admin
    .from("memberships")
    .upsert({ user_id: g.data.user.id, workspace_id: workspaceId, role });
  revalidatePath(`/admin/clients/${workspaceId}`);
  return {
    ok: true,
    link: g.data.properties?.action_link ?? "",
    message: `Access link for ${email} (role: ${role}):`,
  };
}

/** Change an existing member's per-company role (owner/manager/viewer). */
export async function updateMemberRole(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const userId = String(formData.get("user_id") ?? "");
  const role = coerceRole(formData.get("role"));
  if (!workspaceId || !userId) return { error: "Missing member." };
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const { error } = await admin
    .from("memberships")
    .update({ role })
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId);
  if (error) return { error: `Couldn't update role: ${error.message}` };
  revalidatePath(`/admin/clients/${workspaceId}`);
  return { ok: true, message: `Role updated to ${role}.` };
}

/** Update a client's white-label branding (name / logo / accent color). */
export async function updateBranding(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  if (!workspaceId) return { error: "Missing workspace." };
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const displayName = String(formData.get("display_name") ?? "").trim() || null;
  const logoUrl = String(formData.get("logo_url") ?? "").trim() || null;
  const brandColor = String(formData.get("brand_color") ?? "").trim() || null;
  if (brandColor && !/^#[0-9a-fA-F]{6}$/.test(brandColor)) {
    return { error: "Brand color must be a hex value like #7c3aed." };
  }

  const { error } = await admin
    .from("workspaces")
    .update({ display_name: displayName, logo_url: logoUrl, brand_color: brandColor })
    .eq("id", workspaceId);
  if (error) return { error: `Save failed: ${error.message}` };
  revalidatePath(`/admin/clients/${workspaceId}`);
  return { ok: true, message: "Branding saved." };
}

/** Issue an invoice for a client (super-admin only). */
export async function createInvoice(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const number = String(formData.get("number") ?? "").trim();
  const amount = Number(formData.get("amount") ?? 0);
  const dueAt = String(formData.get("due_at") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  if (!workspaceId || !number) return { error: "Invoice number is required." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter a valid amount." };
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const { error } = await admin.from("invoices").insert({
    workspace_id: workspaceId,
    number,
    amount_cents: Math.round(amount * 100),
    currency: String(formData.get("currency") ?? "USD").trim() || "USD",
    status: "due",
    due_at: dueAt,
    notes,
  });
  if (error) return { error: `Couldn't create invoice: ${error.message}` };
  revalidatePath(`/admin/clients/${workspaceId}`);
  return { ok: true, message: `Invoice ${number} created.` };
}

/** Flip an invoice's status (draft/due/paid/void). */
export async function setInvoiceStatus(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const id = String(formData.get("invoice_id") ?? "");
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["draft", "due", "paid", "void"].includes(status)) {
    return { error: "Invalid invoice update." };
  }
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const { error } = await admin
    .from("invoices")
    .update({ status, paid_at: status === "paid" ? new Date().toISOString() : null })
    .eq("id", id);
  if (error) return { error: `Update failed: ${error.message}` };
  revalidatePath(`/admin/clients/${workspaceId}`);
  return { ok: true, message: `Invoice marked ${status}.` };
}

/** Post a notification to a whole client workspace (super-admin only). */
export async function postNotification(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim() || null;
  const level = String(formData.get("level") ?? "info");
  if (!workspaceId || !title) return { error: "Title is required." };
  if (!["info", "success", "warning", "critical"].includes(level)) {
    return { error: "Invalid level." };
  }
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const { error } = await admin
    .from("notifications")
    .insert({ workspace_id: workspaceId, title, body, level });
  if (error) return { error: `Couldn't post: ${error.message}` };
  revalidatePath(`/admin/clients/${workspaceId}`);
  return { ok: true, message: "Notification sent to the client." };
}

/** Regenerate a copyable access (set-password) link for an existing user. */
export async function generateAccessLink(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const email = String(formData.get("email") ?? "").trim();
  if (!email) return { error: "Email is required." };
  if (!supabaseConfigured()) return { error: "Connect Supabase first." };
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  const g = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo: CONFIRM_REDIRECT },
  });
  if (g.error) return { error: `Couldn't generate link: ${g.error.message}` };
  return { ok: true, link: g.data.properties?.action_link ?? "", message: `Access link for ${email}:` };
}

/** Connect an SMTP/IMAP sending mailbox to Smartlead (agency master account). */
export async function connectMailbox(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const master = await masterClient();
  if (!master) return { error: "Set the master Smartlead API key in Settings first." };

  const fromName = String(formData.get("from_name") ?? "").trim();
  const fromEmail = String(formData.get("from_email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const smtpHost = String(formData.get("smtp_host") ?? "").trim();
  const imapHost = String(formData.get("imap_host") ?? "").trim();
  if (!fromEmail || !password || !smtpHost) {
    return { error: "From email, password, and SMTP host are required." };
  }

  try {
    const res = await master.createEmailAccount({
      fromName: fromName || fromEmail,
      fromEmail,
      username: String(formData.get("username") ?? fromEmail).trim() || fromEmail,
      password,
      smtpHost,
      smtpPort: Number(formData.get("smtp_port") ?? 587),
      smtpPortType: (String(formData.get("smtp_port_type") ?? "TLS") as "TLS" | "SSL" | "NONE"),
      imapHost: imapHost || smtpHost.replace("smtp", "imap"),
      imapPort: Number(formData.get("imap_port") ?? 993),
      maxEmailPerDay: Number(formData.get("max_per_day") ?? 50),
    });
    revalidatePath("/admin/mailboxes");
    return { ok: true, message: `Mailbox connected (account #${res.id}).` };
  } catch (e) {
    return { error: `Mailbox connection failed: ${(e as Error).message}` };
  }
}

/** Save the agency master Smartlead key + base URL (super-admin only). */
export async function saveSettings(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();

  const key = String(formData.get("master_key") ?? "").trim();
  const baseUrl = String(formData.get("base_url") ?? "").trim() || DEFAULT_BASE_URL;
  if (!key) return { error: "Master API key is required." };

  if (!supabaseConfigured()) {
    return {
      error:
        "Supabase isn't configured, so the key can't be stored. Set SMARTLEAD_API_KEY in .env.local instead.",
    };
  }
  const admin = createAdminClient();
  if (!admin) return { error: "SUPABASE_SERVICE_ROLE_KEY is not set." };

  // validate the key against Smartlead before saving
  try {
    await new SmartleadClient(key, baseUrl).ping();
  } catch (e) {
    return { error: `That key was rejected by Smartlead: ${(e as Error).message}` };
  }

  const { error } = await admin
    .from("app_settings")
    .update({ smartlead_master_key: key, smartlead_base_url: baseUrl, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) return { error: `Save failed: ${error.message}` };

  revalidatePath("/admin/settings");
  return { ok: true, message: "Master Smartlead key validated and saved." };
}

/** Test the currently-configured master key. */
export async function testConnection(): Promise<ActionState> {
  await requireSuperAdmin();
  const creds = await getMasterCreds();
  if (!creds) return { error: "No master Smartlead key configured." };
  try {
    await new SmartleadClient(creds.masterKey, creds.baseUrl).ping();
    return { ok: true, message: "Connection OK — Smartlead accepted the master key." };
  } catch (e) {
    return { error: `Connection failed: ${(e as Error).message}` };
  }
}
