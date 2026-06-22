/**
 * Smartlead credential resolution (server-only).
 *
 *   master key  → app_settings table (super-admin managed) ?? env SMARTLEAD_API_KEY
 *   client key  → workspaces.smartlead_api_key (set during onboarding)
 *
 * The master client does account-level work (create clients, connect mailboxes).
 * A workspace only goes "live" once it has its own client-scoped key; until then
 * its screens render seeded mock data.
 */

import "server-only";
import { SmartleadClient, DEFAULT_BASE_URL } from "./smartlead";
import { supabaseConfigured } from "./supabase/env";
import { createClient as createSupabaseServer } from "./supabase/server";
import type { Workspace } from "./types";

export interface MasterCreds {
  masterKey: string;
  baseUrl: string;
}

export async function getMasterCreds(): Promise<MasterCreds | null> {
  // 1) super-admin–managed settings (when Supabase is configured)
  if (supabaseConfigured()) {
    try {
      const sb = await createSupabaseServer();
      const { data } = await sb
        .from("app_settings")
        .select("smartlead_master_key, smartlead_base_url")
        .eq("id", 1)
        .single();
      if (data?.smartlead_master_key) {
        return {
          masterKey: data.smartlead_master_key as string,
          baseUrl: (data.smartlead_base_url as string) || DEFAULT_BASE_URL,
        };
      }
    } catch {
      /* table missing / not signed in — fall through to env */
    }
  }
  // 2) environment fallback
  const envKey = process.env.SMARTLEAD_API_KEY;
  if (envKey) {
    return { masterKey: envKey, baseUrl: process.env.SMARTLEAD_BASE_URL || DEFAULT_BASE_URL };
  }
  return null;
}

export async function masterConfigured(): Promise<boolean> {
  return (await getMasterCreds()) !== null;
}

/** Account-level client (create clients, connect mailboxes). Null if no master key. */
export async function masterClient(): Promise<SmartleadClient | null> {
  const creds = await getMasterCreds();
  return creds ? new SmartleadClient(creds.masterKey, creds.baseUrl) : null;
}

/** Live client for a workspace, or null → render mock data for that workspace. */
export async function clientForWorkspace(ws: Workspace): Promise<SmartleadClient | null> {
  if (!ws.smartleadApiKey) return null;
  const creds = await getMasterCreds();
  return new SmartleadClient(ws.smartleadApiKey, creds?.baseUrl ?? DEFAULT_BASE_URL);
}
