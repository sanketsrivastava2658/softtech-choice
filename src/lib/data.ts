/**
 * Data-access layer — the single seam every screen/route imports.
 *
 * Per workspace: if it has a Smartlead client key, read live; otherwise render
 * seeded mock data. Live fetches that fail fall back to mock so a transient API
 * error never blanks a client's dashboard.
 */

import "server-only";
import type {
  AnalyticsSummary,
  Campaign,
  CampaignDetail,
  DateRange,
  EmailAccount,
  EngagementPoint,
  InboxMessage,
  Workspace,
} from "./types";
import { getWorkspaceDataset, workspaces as mockWorkspaces } from "./mock-data";
import { clientForWorkspace } from "./credentials";
import { supabaseConfigured } from "./supabase/env";
import { createClient as createSupabaseServer } from "./supabase/server";

export type DataMode = "live" | "demo";

interface RawWorkspaceRow {
  id: string;
  name: string;
  slug: string;
  smartlead_client_id: number | null;
  smartlead_api_key: string | null;
  status: string | null;
  primary_domain: string | null;
}

function mapWorkspaceRow(r: RawWorkspaceRow): Workspace {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    smartleadClientId: r.smartlead_client_id,
    smartleadApiKey: r.smartlead_api_key,
    status: (r.status as Workspace["status"]) ?? "active",
    primaryDomain: r.primary_domain,
  };
}

/** Workspaces visible to the current user (RLS-scoped) — mock list otherwise. */
export async function listWorkspaces(): Promise<Workspace[]> {
  if (supabaseConfigured()) {
    try {
      const sb = await createSupabaseServer();
      const { data } = await sb
        .from("workspaces")
        .select(
          "id, name, slug, smartlead_client_id, smartlead_api_key, status, primary_domain"
        )
        .order("name");
      if (data && data.length) return (data as RawWorkspaceRow[]).map(mapWorkspaceRow);
    } catch {
      /* fall through to mock */
    }
  }
  return mockWorkspaces;
}

export async function getWorkspace(id: string): Promise<Workspace> {
  const list = await listWorkspaces();
  return list.find((w) => w.id === id) ?? list[0];
}

async function liveClient(workspaceId: string) {
  const ws = await getWorkspace(workspaceId);
  return clientForWorkspace(ws);
}

// ── helpers ───────────────────────────────────────────────────────────
function inRange(p: EngagementPoint, range?: DateRange): boolean {
  if (!range) return true;
  return p.date >= range.from && p.date <= range.to;
}
function summarize(engagement: EngagementPoint[], leads: number, positiveRatio = 0.42): AnalyticsSummary {
  const sum = (k: keyof EngagementPoint) =>
    engagement.reduce((s, p) => s + (p[k] as number), 0);
  const emailsSent = sum("sent");
  const opened = sum("opened");
  const replied = sum("replied");
  const bounced = sum("bounced");
  const positiveReplies = Math.round(replied * positiveRatio);
  const r = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  return {
    emailsSent,
    leads,
    opened,
    openRate: r(opened, emailsSent),
    replied,
    replyRate: r(replied, emailsSent),
    positiveReplies,
    positiveReplyRate: r(positiveReplies, emailsSent),
    bounced,
    bounceRate: r(bounced, emailsSent),
  };
}
function summarizeCampaigns(campaigns: Campaign[]): AnalyticsSummary {
  const emailsSent = campaigns.reduce((s, c) => s + c.sentCount, 0);
  const leads = campaigns.reduce((s, c) => s + c.leadCount, 0);
  const opened = campaigns.reduce((s, c) => s + (c.sentCount * c.openRate) / 100, 0);
  const replied = campaigns.reduce((s, c) => s + (c.sentCount * c.replyRate) / 100, 0);
  const bounced = campaigns.reduce((s, c) => s + (c.sentCount * c.bounceRate) / 100, 0);
  const positiveReplies = campaigns.reduce(
    (s, c) => s + (c.sentCount * c.positiveReplyRate) / 100,
    0
  );
  const r = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  return {
    emailsSent,
    leads,
    opened: Math.round(opened),
    openRate: r(opened, emailsSent),
    replied: Math.round(replied),
    replyRate: r(replied, emailsSent),
    positiveReplies: Math.round(positiveReplies),
    positiveReplyRate: r(positiveReplies, emailsSent),
    bounced: Math.round(bounced),
    bounceRate: r(bounced, emailsSent),
  };
}

// ── reads ─────────────────────────────────────────────────────────────
export interface AnalyticsResult {
  summary: AnalyticsSummary;
  engagement: EngagementPoint[];
  mode: DataMode;
}

export async function getAnalytics(
  workspaceId: string,
  range?: DateRange,
  campaignId?: string
): Promise<AnalyticsResult> {
  const client = await liveClient(workspaceId);
  if (client) {
    try {
      const campaigns = await client.listCampaigns();
      const scoped = campaignId ? campaigns.filter((c) => c.id === campaignId) : campaigns;
      // Live daily series needs the sync snapshot job; report totals with an
      // empty series until snapshots accumulate.
      return { mode: "live", engagement: [], summary: summarizeCampaigns(scoped) };
    } catch {
      /* fall through to demo */
    }
  }

  const ds = getWorkspaceDataset(workspaceId);
  let engagement = ds.engagement.filter((p) => inRange(p, range));
  let leads = ds.summary.leads;
  if (campaignId) {
    const c = ds.campaigns.find((c) => c.id === campaignId);
    engagement = (c?.engagement ?? []).filter((p) => inRange(p, range));
    leads = c?.leadCount ?? 0;
  }
  return { mode: "demo", engagement, summary: summarize(engagement, leads) };
}

export async function getCampaigns(workspaceId: string): Promise<Campaign[]> {
  const client = await liveClient(workspaceId);
  if (client) {
    try {
      return await client.listCampaigns();
    } catch {
      /* fall through */
    }
  }
  return getWorkspaceDataset(workspaceId).campaigns;
}

export async function getCampaign(
  workspaceId: string,
  campaignId: string
): Promise<CampaignDetail | null> {
  const ds = getWorkspaceDataset(workspaceId);
  const found = ds.campaigns.find((c) => c.id === campaignId);
  if (found) return found;
  const client = await liveClient(workspaceId);
  if (client) {
    try {
      const live = (await client.listCampaigns()).find((c) => c.id === campaignId);
      if (live) return { ...live, sequence: [], engagement: [] };
    } catch {
      /* fall through */
    }
  }
  return null;
}

export async function getInbox(workspaceId: string): Promise<InboxMessage[]> {
  const client = await liveClient(workspaceId);
  if (client) {
    try {
      const campaigns = await client.listCampaigns();
      return await client.fetchInbox(campaigns.map((c) => c.id));
    } catch {
      /* fall through */
    }
  }
  return getWorkspaceDataset(workspaceId).inbox;
}

export async function getAccounts(workspaceId: string): Promise<EmailAccount[]> {
  const client = await liveClient(workspaceId);
  if (client) {
    try {
      return await client.listEmailAccounts();
    } catch {
      /* fall through */
    }
  }
  return getWorkspaceDataset(workspaceId).accounts;
}
