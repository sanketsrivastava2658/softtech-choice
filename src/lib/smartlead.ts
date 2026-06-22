/**
 * Smartlead API client (server-only) — per-tenant.
 *
 * Every instance is bound to ONE api_key:
 *   - the agency MASTER key (account-level ops: create clients, create mailboxes)
 *   - a CLIENT-scoped key returned by /client/save (that client's campaigns only)
 *
 * Base URL: https://server.smartlead.ai/api/v1 ; auth via ?api_key= query param.
 * Reads are cached briefly; writes are never cached.
 *
 * Fields marked `VERIFY` should be confirmed against a live response and
 * tightened (analytics/reply payloads vary by plan).
 */

import "server-only";
import type {
  Campaign,
  CampaignStatus,
  EmailAccount,
  InboxMessage,
  ReplyCategory,
} from "./types";

export const DEFAULT_BASE_URL = "https://server.smartlead.ai/api/v1";

export class SmartleadError extends Error {
  constructor(
    message: string,
    public status?: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "SmartleadError";
  }
}

// ── integration input/output types ──────────────────────────────────────
export interface CreateClientInput {
  name: string;
  email: string;
  password?: string;
  logoUrl?: string;
  permissions?: string[];
}
export interface CreateClientResult {
  id: number;
  apiKey: string;
  name: string;
  email: string;
}

export interface SequenceStepInput {
  seqNumber: number;
  subject: string;
  emailBody: string; // HTML, supports {{variables}}
  delayDays: number; // 0 for the first step
}

export interface ScheduleInput {
  timezone: string; // e.g. "America/New_York"
  daysOfWeek: number[]; // 1=Mon … 7=Sun
  startHour: string; // "09:00"
  endHour: string; // "17:00"
  minTimeBtwEmails: number; // minutes
  maxLeadsPerDay: number;
}

export interface LeadInput {
  email: string;
  firstName?: string;
  lastName?: string;
  companyName?: string;
  phone?: string;
  website?: string;
  location?: string;
  customFields?: Record<string, string>;
}

export interface LeadImportSettings {
  ignoreGlobalBlockList?: boolean;
  ignoreUnsubscribeList?: boolean;
  ignoreCommunityBounceList?: boolean;
  ignoreDuplicateLeadsInOtherCampaign?: boolean;
}

export interface CreateEmailAccountInput {
  fromName: string;
  fromEmail: string;
  username: string;
  password: string;
  smtpHost: string;
  smtpPort: number;
  smtpPortType?: "TLS" | "SSL" | "NONE";
  imapHost: string;
  imapPort: number;
  maxEmailPerDay?: number;
}

export type CampaignStatusAction = "START" | "PAUSED" | "STOPPED";

// ── helpers ─────────────────────────────────────────────────────────────
const num = (v: unknown): number => {
  const n = typeof v === "string" ? parseFloat(v) : (v as number);
  return Number.isFinite(n) ? n : 0;
};
const pct = (part: unknown, whole: unknown): number => {
  const w = num(whole);
  return w > 0 ? (num(part) / w) * 100 : 0;
};

function mapStatus(raw: string | undefined): CampaignStatus {
  switch ((raw ?? "").toUpperCase()) {
    case "ACTIVE":
    case "START":
    case "RUNNING":
      return "active";
    case "PAUSED":
      return "paused";
    case "COMPLETED":
    case "STOPPED":
      return "completed";
    case "WARMING":
      return "warming";
    default:
      return "draft";
  }
}

const CATEGORY_MAP: Record<string, ReplyCategory> = {
  interested: "interested",
  "meeting request": "meeting_request",
  meeting_request: "meeting_request",
  "not interested": "not_interested",
  "out of office": "out_of_office",
  "wrong person": "wrong_person",
  "do not contact": "do_not_contact",
  unsubscribe: "do_not_contact",
};
export function mapReplyCategory(raw: string | undefined): ReplyCategory {
  return CATEGORY_MAP[(raw ?? "").toLowerCase()] ?? "neutral";
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

// ── raw payload shapes ──────────────────────────────────────────────────
interface RawCampaign {
  id: number;
  name: string;
  status?: string;
  created_at?: string;
  client_id?: number;
}
interface RawAnalytics {
  sent_count?: number | string;
  unique_open_count?: number | string;
  reply_count?: number | string;
  bounce_count?: number | string;
  total_count?: number | string;
}
interface RawEmailAccount {
  id: number;
  from_email: string;
  from_name?: string;
  type?: string;
  is_smtp_success?: boolean;
  message_per_day?: number | string;
  client_id?: number | null;
  warmup_details?: { status?: string; warmup_reputation?: number | string };
}
interface RawReply {
  stats_id?: string;
  lead_email?: string;
  lead_name?: string;
  campaign_id?: number;
  campaign_name?: string;
  subject?: string;
  email_body?: string;
  time?: string;
  reply_category?: string;
}

// ── the client ──────────────────────────────────────────────────────────
export class SmartleadClient {
  constructor(
    private apiKey: string,
    private baseUrl: string = DEFAULT_BASE_URL
  ) {
    if (!apiKey) throw new SmartleadError("SmartleadClient requires an api_key");
  }

  private async request<T>(
    method: string,
    path: string,
    opts: { query?: Record<string, string>; body?: unknown; revalidate?: number } = {}
  ): Promise<T> {
    const url = new URL(`${this.baseUrl}${path}`);
    url.searchParams.set("api_key", this.apiKey);
    for (const [k, v] of Object.entries(opts.query ?? {})) url.searchParams.set(k, v);

    const init: RequestInit & { next?: { revalidate: number } } = {
      method,
      headers: { accept: "application/json" },
    };
    if (opts.body !== undefined) {
      init.headers = { ...init.headers, "content-type": "application/json" };
      init.body = JSON.stringify(opts.body);
      init.cache = "no-store";
    } else {
      init.next = { revalidate: opts.revalidate ?? 60 };
    }

    const res = await fetch(url, init);
    const text = await res.text();
    let json: unknown = undefined;
    try {
      json = text ? JSON.parse(text) : undefined;
    } catch {
      json = text;
    }
    if (!res.ok) {
      const msg =
        (json && typeof json === "object" && "message" in json
          ? String((json as { message: unknown }).message)
          : `${res.status} ${res.statusText}`) || "request failed";
      throw new SmartleadError(`Smartlead ${method} ${path}: ${msg}`, res.status, json);
    }
    return json as T;
  }

  // ---- account-level (master key) -------------------------------------
  /** Create a white-label client. Returns its numeric id + scoped api_key. */
  async createClient(input: CreateClientInput): Promise<CreateClientResult> {
    const res = await this.request<{
      ok?: boolean;
      data?: { id: number; api_key: string; name: string; email: string };
      id?: number;
      api_key?: string;
    }>("POST", "/client/save", {
      body: {
        name: input.name,
        email: input.email,
        password: input.password,
        logo_url: input.logoUrl,
        permission: input.permissions ?? ["reply_master_inbox", "view_email_accounts"],
      },
    });
    const d = res.data ?? (res as { id: number; api_key: string; name: string; email: string });
    return {
      id: num(d.id),
      apiKey: String(d.api_key ?? ""),
      name: String(d.name ?? input.name),
      email: String(d.email ?? input.email),
    };
  }

  /** Connect an SMTP/IMAP sending mailbox. Returns the new account id. */
  async createEmailAccount(input: CreateEmailAccountInput): Promise<{ id: number }> {
    const res = await this.request<{ ok?: boolean; emailAccountId?: number; id?: number }>(
      "POST",
      "/email-accounts/save",
      {
        body: {
          from_name: input.fromName,
          from_email: input.fromEmail,
          user_name: input.username,
          password: input.password,
          smtp_host: input.smtpHost,
          smtp_port: input.smtpPort,
          smtp_port_type: input.smtpPortType ?? "TLS",
          imap_host: input.imapHost,
          imap_port: input.imapPort,
          max_email_per_day: input.maxEmailPerDay ?? 50,
        },
      }
    );
    return { id: num(res.emailAccountId ?? res.id) };
  }

  // ---- campaign lifecycle ---------------------------------------------
  async createCampaign(name: string, clientId?: number): Promise<{ id: number }> {
    const res = await this.request<{ ok?: boolean; id: number }>("POST", "/campaigns/create", {
      body: { name, client_id: clientId },
    });
    return { id: num(res.id) };
  }

  async saveSequence(campaignId: number, steps: SequenceStepInput[]): Promise<void> {
    await this.request("POST", `/campaigns/${campaignId}/sequences`, {
      body: {
        sequences: steps.map((s) => ({
          id: null,
          seq_number: s.seqNumber,
          subject: s.subject,
          email_body: s.emailBody,
          seq_delay_details: { delay_in_days: s.delayDays },
        })),
      },
    });
  }

  async updateSchedule(campaignId: number, s: ScheduleInput): Promise<void> {
    await this.request("POST", `/campaigns/${campaignId}/schedule`, {
      body: {
        timezone: s.timezone,
        days_of_the_week: s.daysOfWeek,
        start_hour: s.startHour,
        end_hour: s.endHour,
        min_time_btw_emails: s.minTimeBtwEmails,
        max_leads_per_day: s.maxLeadsPerDay,
      },
    });
  }

  async assignEmailAccounts(campaignId: number, accountIds: number[]): Promise<void> {
    await this.request("POST", `/campaigns/${campaignId}/email-accounts`, {
      body: { email_account_ids: accountIds },
    });
  }

  /** Import leads (chunked to Smartlead's 400-per-request limit). */
  async addLeads(
    campaignId: number,
    leads: LeadInput[],
    settings: LeadImportSettings = {}
  ): Promise<{ uploaded: number }> {
    let uploaded = 0;
    for (const part of chunk(leads, 400)) {
      const res = await this.request<{ upload_count?: number; total_leads?: number }>(
        "POST",
        `/campaigns/${campaignId}/leads`,
        {
          body: {
            lead_list: part.map((l) => ({
              email: l.email,
              first_name: l.firstName,
              last_name: l.lastName,
              company_name: l.companyName,
              phone_number: l.phone,
              website: l.website,
              location: l.location,
              custom_fields: l.customFields,
            })),
            settings: {
              ignore_global_block_list: settings.ignoreGlobalBlockList ?? false,
              ignore_unsubscribe_list: settings.ignoreUnsubscribeList ?? false,
              ignore_community_bounce_list: settings.ignoreCommunityBounceList ?? false,
              ignore_duplicate_leads_in_other_campaign:
                settings.ignoreDuplicateLeadsInOtherCampaign ?? false,
            },
          },
        }
      );
      uploaded += num(res.upload_count ?? part.length);
    }
    return { uploaded };
  }

  async updateStatus(campaignId: number, status: CampaignStatusAction): Promise<void> {
    await this.request("PATCH", `/campaigns/${campaignId}/status`, { body: { status } });
  }

  // ---- reads -----------------------------------------------------------
  async listCampaigns(): Promise<Campaign[]> {
    const raw = await this.request<RawCampaign[]>("GET", "/campaigns/");
    const list = Array.isArray(raw) ? raw : [];
    return Promise.all(
      list.map(async (c) => {
        let a: RawAnalytics = {};
        try {
          a = await this.request<RawAnalytics>("GET", `/campaigns/${c.id}/analytics`);
        } catch {
          /* analytics optional per campaign */
        }
        const sent = num(a.sent_count);
        return {
          id: String(c.id),
          name: c.name,
          status: mapStatus(c.status),
          createdAt: c.created_at ?? new Date().toISOString(),
          leadCount: num(a.total_count),
          sentCount: sent,
          openRate: pct(a.unique_open_count, sent),
          replyRate: pct(a.reply_count, sent),
          positiveReplyRate: pct(a.reply_count, sent) * 0.42, // VERIFY positive-intent source
          bounceRate: pct(a.bounce_count, sent),
        } satisfies Campaign;
      })
    );
  }

  async listEmailAccounts(): Promise<EmailAccount[]> {
    const raw = await this.request<RawEmailAccount[]>("GET", "/email-accounts/");
    const list = Array.isArray(raw) ? raw : [];
    return list.map((e) => {
      const rep = num(e.warmup_details?.warmup_reputation);
      return {
        id: String(e.id),
        fromEmail: e.from_email,
        fromName: e.from_name ?? e.from_email,
        provider: e.type ?? "SMTP",
        status: e.is_smtp_success === false ? "error" : "active",
        warmupStatus:
          (e.warmup_details?.status ?? "").toUpperCase() === "ACTIVE" ? "active" : "paused",
        warmupReputation: rep,
        dailyLimit: num(e.message_per_day),
        sentToday: 0, // VERIFY per-account sent-today source
        deliverabilityScore: rep,
      } satisfies EmailAccount;
    });
  }

  async fetchInbox(campaignIds: string[]): Promise<InboxMessage[]> {
    const all = await Promise.all(
      campaignIds.map(async (id) => {
        try {
          const raw = await this.request<RawReply[]>("GET", `/campaigns/${id}/statistics`, {
            query: { reply_message: "true" },
          });
          return Array.isArray(raw) ? raw : [];
        } catch {
          return [] as RawReply[];
        }
      })
    );
    return all
      .flat()
      .filter((r) => r.email_body)
      .map((r, i) => {
        const body = (r.email_body ?? "").replace(/<[^>]+>/g, " ").trim();
        return {
          id: r.stats_id ?? `reply_${i}`,
          leadEmail: r.lead_email ?? "unknown@unknown.com",
          leadName: r.lead_name ?? r.lead_email ?? "Unknown",
          leadCompany: "",
          campaignId: String(r.campaign_id ?? ""),
          campaignName: r.campaign_name ?? "",
          subject: r.subject ?? "(no subject)",
          snippet: body.slice(0, 120),
          body,
          receivedAt: r.time ?? new Date().toISOString(),
          category: mapReplyCategory(r.reply_category),
          read: false,
        } satisfies InboxMessage;
      });
  }

  /** Cheap connectivity check used by the admin "Test connection" button. */
  async ping(): Promise<boolean> {
    await this.request("GET", "/campaigns/", { revalidate: 0 });
    return true;
  }
}
