/**
 * Seeded mock dataset — the app's fallback when SMARTLEAD_API_KEY is absent,
 * and the fixture used for local/demo runs. Deterministic (seeded PRNG, no
 * Math.random) so every render and every machine sees identical numbers.
 *
 * Shapes here are the SAME domain types the Smartlead client emits, so screens
 * can't tell the difference between mock and live data.
 */

import type {
  AnalyticsSummary,
  Campaign,
  CampaignDetail,
  CampaignStatus,
  EmailAccount,
  EngagementPoint,
  InboxMessage,
  ReplyCategory,
  SequenceStep,
  Workspace,
} from "./types";

export const workspaces: Workspace[] = [
  { id: "ws_acme", name: "Acme B2B", slug: "acme-b2b" },
  { id: "ws_northwind", name: "Northwind SaaS", slug: "northwind-saas" },
  { id: "ws_vertex", name: "Vertex Health", slug: "vertex-health" },
];

export const AGENCY_NAME = "Softtech Choice";

// ---- deterministic PRNG (mulberry32) ----
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seedFromString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
const pick = <T,>(r: () => number, arr: T[]): T => arr[Math.floor(r() * arr.length)];
const between = (r: () => number, lo: number, hi: number) => lo + r() * (hi - lo);

const CAMPAIGN_NAMES = [
  "Q2 — SaaS Founders",
  "Series A CTOs",
  "RevOps Leaders",
  "Agency Owners",
  "Healthcare Ops",
  "Fintech Heads of Growth",
  "E-comm Performance",
  "DevTools Champions",
];
const STATUSES: CampaignStatus[] = ["active", "active", "active", "warming", "paused", "completed"];
const FIRST = ["Sarah", "Mike", "Priya", "David", "Elena", "James", "Nina", "Omar", "Grace", "Tom"];
const LAST = ["Chen", "Patel", "Okafor", "Rossi", "Nguyen", "Müller", "Silva", "Kim", "Hassan", "Walsh"];
const COMPANIES = ["Northwind", "Apex Labs", "Brightwave", "Corewave", "Lumio", "Tessel", "Vanta Co", "Helix"];

const REPLY_BODIES: Record<ReplyCategory, string[]> = {
  interested: [
    "This is interesting — can you send more detail on pricing?",
    "We're actually evaluating something like this. What's the next step?",
  ],
  meeting_request: [
    "Sure, let's set up a call. Does Thursday 2pm work?",
    "Happy to chat. Send me a calendar link and I'll book a slot.",
  ],
  not_interested: [
    "Not a fit for us right now, thanks.",
    "We've already got a solution in place, but appreciate the note.",
  ],
  neutral: [
    "Can you remind me what this is about?",
    "Who handles this on your side?",
  ],
  out_of_office: [
    "I'm out of office until Monday with limited access to email.",
    "On PTO this week — will respond when I'm back.",
  ],
  wrong_person: [
    "You'll want to talk to our marketing lead, not me.",
    "I don't own this — try reaching out to ops.",
  ],
  do_not_contact: [
    "Please remove me from your list.",
    "Unsubscribe — do not contact again.",
  ],
};
const CATEGORIES: ReplyCategory[] = [
  "interested",
  "meeting_request",
  "interested",
  "neutral",
  "not_interested",
  "out_of_office",
  "meeting_request",
  "wrong_person",
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}
function isoHoursAgo(hours: number): string {
  const d = new Date();
  d.setUTCHours(d.getUTCHours() - hours);
  return d.toISOString();
}

function genCampaigns(wsId: string): CampaignDetail[] {
  const r = rng(seedFromString(wsId + ":campaigns"));
  const count = 4 + Math.floor(r() * 3); // 4..6
  const used = new Set<number>();
  const out: CampaignDetail[] = [];
  for (let i = 0; i < count; i++) {
    let ni = Math.floor(r() * CAMPAIGN_NAMES.length);
    while (used.has(ni)) ni = (ni + 1) % CAMPAIGN_NAMES.length;
    used.add(ni);

    const status = STATUSES[i % STATUSES.length];
    const sent = Math.round(between(r, 1800, 14000));
    const leadCount = Math.round(sent / between(r, 2.5, 3.5));
    const openRate = between(r, 38, 68);
    const replyRate = between(r, 3.2, 11.5);
    const positiveReplyRate = replyRate * between(r, 0.32, 0.55);
    const bounceRate = between(r, 0.4, 3.8);

    const sequence: SequenceStep[] = [];
    const steps = 3 + Math.floor(r() * 2);
    for (let s = 0; s < steps; s++) {
      const stepSent = Math.round(sent * (1 - s * 0.18));
      sequence.push({
        stepNumber: s + 1,
        subject:
          s === 0
            ? "Quick question, {{company}}"
            : s === 1
            ? "Re: Quick question"
            : `Following up (${s + 1})`,
        delayDays: s === 0 ? 0 : 2 + s,
        sentCount: Math.max(0, stepSent),
        openRate: openRate * between(r, 0.85, 1.05),
        replyRate: replyRate * between(r, 0.6, 1.1),
      });
    }

    out.push({
      id: `cmp_${wsId.slice(3)}_${i}`,
      name: CAMPAIGN_NAMES[ni],
      status,
      createdAt: isoDaysAgo(Math.round(between(r, 12, 90))),
      leadCount,
      sentCount: sent,
      openRate,
      replyRate,
      positiveReplyRate,
      bounceRate,
      sequence,
      engagement: genEngagement(wsId + ":" + i, 30, sent),
    });
  }
  return out;
}

function genEngagement(seedKey: string, days: number, totalSent: number): EngagementPoint[] {
  const r = rng(seedFromString(seedKey + ":eng"));
  const points: EngagementPoint[] = [];
  const perDay = totalSent / days;
  for (let i = days - 1; i >= 0; i--) {
    const weekday = (new Date(isoDaysAgo(i)).getUTCDay() + 6) % 7; // 0=Mon
    const weekendDamp = weekday >= 5 ? 0.25 : 1;
    const sent = Math.round(perDay * between(r, 0.6, 1.4) * weekendDamp);
    const opened = Math.round(sent * between(r, 0.4, 0.66));
    const replied = Math.round(sent * between(r, 0.03, 0.1));
    const bounced = Math.round(sent * between(r, 0.004, 0.03));
    points.push({ date: isoDaysAgo(i), sent, opened, replied, bounced });
  }
  return points;
}

function genInbox(wsId: string, campaigns: Campaign[]): InboxMessage[] {
  const r = rng(seedFromString(wsId + ":inbox"));
  const out: InboxMessage[] = [];
  const n = 9 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) {
    const cat = CATEGORIES[Math.floor(r() * CATEGORIES.length)];
    const first = pick(r, FIRST);
    const last = pick(r, LAST);
    const company = pick(r, COMPANIES);
    const campaign = pick(r, campaigns);
    const body = pick(r, REPLY_BODIES[cat]);
    out.push({
      id: `msg_${wsId.slice(3)}_${i}`,
      leadEmail: `${first.toLowerCase()}.${last.toLowerCase()}@${company
        .toLowerCase()
        .replace(/\s/g, "")}.com`,
      leadName: `${first} ${last}`,
      leadCompany: company,
      campaignId: campaign.id,
      campaignName: campaign.name,
      subject: `Re: ${pick(r, ["Quick question", "Following up", "Re: Quick question"])}`,
      snippet: body.slice(0, 90),
      body,
      receivedAt: isoHoursAgo(Math.round(between(r, 0.2, 120))),
      category: cat,
      read: r() > 0.55,
    });
  }
  return out.sort((a, b) => +new Date(b.receivedAt) - +new Date(a.receivedAt));
}

function genAccounts(wsId: string): EmailAccount[] {
  const r = rng(seedFromString(wsId + ":accounts"));
  const domains = ["outreach", "mail", "go", "team"];
  const tlds = ["acme.co", "acmehq.com", "getacme.io"];
  const out: EmailAccount[] = [];
  const n = 4 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) {
    const first = pick(r, FIRST).toLowerCase();
    const domain = `${pick(r, domains)}.${pick(r, tlds)}`;
    const rep = Math.round(between(r, 78, 99));
    const status = rep < 82 ? "error" : r() > 0.85 ? "paused" : "active";
    const limit = Math.round(between(r, 30, 80));
    out.push({
      id: `acc_${wsId.slice(3)}_${i}`,
      fromEmail: `${first}@${domain}`,
      fromName: `${first[0].toUpperCase()}${first.slice(1)} from Acme`,
      provider: pick(r, ["Google", "Microsoft 365", "SMTP"]),
      status: status as EmailAccount["status"],
      warmupStatus: r() > 0.2 ? "active" : "paused",
      warmupReputation: rep,
      dailyLimit: limit,
      sentToday: Math.round(limit * between(r, 0.2, 0.95)),
      deliverabilityScore: rep,
    });
  }
  return out;
}

function summarize(campaigns: Campaign[], engagement: EngagementPoint[]): AnalyticsSummary {
  const emailsSent = engagement.reduce((s, p) => s + p.sent, 0);
  const opened = engagement.reduce((s, p) => s + p.opened, 0);
  const replied = engagement.reduce((s, p) => s + p.replied, 0);
  const bounced = engagement.reduce((s, p) => s + p.bounced, 0);
  const leads = campaigns.reduce((s, c) => s + c.leadCount, 0);
  const positiveReplies = Math.round(replied * 0.42);
  const pct = (a: number, b: number) => (b > 0 ? (a / b) * 100 : 0);
  return {
    emailsSent,
    leads,
    opened,
    openRate: pct(opened, emailsSent),
    replied,
    replyRate: pct(replied, emailsSent),
    positiveReplies,
    positiveReplyRate: pct(positiveReplies, emailsSent),
    bounced,
    bounceRate: pct(bounced, emailsSent),
  };
}

export interface WorkspaceDataset {
  workspace: Workspace;
  campaigns: CampaignDetail[];
  inbox: InboxMessage[];
  accounts: EmailAccount[];
  engagement: EngagementPoint[];
  summary: AnalyticsSummary;
}

const cache = new Map<string, WorkspaceDataset>();

export function getWorkspaceDataset(workspaceId: string): WorkspaceDataset {
  const cached = cache.get(workspaceId);
  if (cached) return cached;

  const workspace =
    workspaces.find((w) => w.id === workspaceId) ?? workspaces[0];
  const campaigns = genCampaigns(workspace.id);

  // workspace-level engagement = sum of campaign series, day by day
  const engMap = new Map<string, EngagementPoint>();
  for (const c of campaigns) {
    for (const p of c.engagement) {
      const cur = engMap.get(p.date) ?? {
        date: p.date,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
      };
      cur.sent += p.sent;
      cur.opened += p.opened;
      cur.replied += p.replied;
      cur.bounced += p.bounced;
      engMap.set(p.date, cur);
    }
  }
  const engagement = [...engMap.values()].sort((a, b) =>
    a.date < b.date ? -1 : 1
  );

  const inbox = genInbox(workspace.id, campaigns);
  const accounts = genAccounts(workspace.id);
  const summary = summarize(campaigns, engagement);

  const ds: WorkspaceDataset = {
    workspace,
    campaigns,
    inbox,
    accounts,
    engagement,
    summary,
  };
  cache.set(workspaceId, ds);
  return ds;
}
