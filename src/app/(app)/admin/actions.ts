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

  await admin.from("memberships").insert({ user_id: invite.user.id, workspace_id: ws.id });

  revalidatePath("/admin");
  return {
    ok: true,
    link: inviteLink,
    message: `Onboarded ${name}. Send ${email} this link to set a password and log in:`,
  };
}

/** Invite an (additional) user into an existing client workspace. */
export async function inviteUserToWorkspace(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireSuperAdmin();
  const workspaceId = String(formData.get("workspace_id") ?? "");
  const email = String(formData.get("email") ?? "").trim();
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

  await admin.from("memberships").upsert({ user_id: g.data.user.id, workspace_id: workspaceId });
  revalidatePath(`/admin/clients/${workspaceId}`);
  return {
    ok: true,
    link: g.data.properties?.action_link ?? "",
    message: `Access link for ${email}:`,
  };
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
