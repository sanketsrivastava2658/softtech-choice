/**
 * Domain models — Smartlead-shaped. These are the app's internal contract;
 * the Smartlead client (lib/smartlead.ts) maps raw API payloads into these,
 * and every screen/component consumes these shapes (never raw API JSON).
 */

export type CampaignStatus =
  | "active"
  | "paused"
  | "completed"
  | "draft"
  | "warming";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  /** Smartlead white-label binding (set during super-admin onboarding). */
  smartleadClientId?: number | null;
  smartleadApiKey?: string | null;
  status?: "active" | "paused" | "onboarding";
  primaryDomain?: string | null;
  /** White-label branding shown in the shell after a client logs in. */
  displayName?: string | null;
  logoUrl?: string | null;
  brandColor?: string | null;
}

/** Per-company role — a user can hold a different role in each workspace. */
export type MembershipRole = "owner" | "manager" | "viewer";

export type LeadStatus =
  | "new"
  | "contacted"
  | "replied"
  | "interested"
  | "qualified"
  | "won"
  | "lost";

export interface Lead {
  id: string;
  email: string;
  fullName: string;
  company: string;
  title: string;
  campaignId: string | null;
  campaignName: string;
  status: LeadStatus;
  source: string;
  createdAt: string; // ISO
}

export type InvoiceStatus = "draft" | "due" | "paid" | "void";

export interface Invoice {
  id: string;
  number: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt: string; // ISO yyyy-mm-dd
  dueAt: string | null;
  paidAt: string | null;
  notes: string | null;
}

export type NotificationLevel = "info" | "success" | "warning" | "critical";

export interface AppNotification {
  id: string;
  title: string;
  body: string | null;
  level: NotificationLevel;
  readAt: string | null;
  createdAt: string; // ISO
}

/** The five headline metrics on the Performance Metrics screen. */
export interface AnalyticsSummary {
  emailsSent: number;
  leads: number;
  opened: number;
  openRate: number; // 0..100
  replied: number;
  replyRate: number;
  positiveReplies: number;
  positiveReplyRate: number;
  bounced: number;
  bounceRate: number;
}

/** One point in the Email Engagement time series (per day, UTC). */
export interface EngagementPoint {
  date: string; // ISO yyyy-mm-dd
  sent: number;
  opened: number;
  replied: number;
  bounced: number;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  createdAt: string; // ISO
  leadCount: number;
  sentCount: number;
  openRate: number;
  replyRate: number;
  positiveReplyRate: number;
  bounceRate: number;
}

export interface SequenceStep {
  stepNumber: number;
  subject: string;
  delayDays: number;
  sentCount: number;
  openRate: number;
  replyRate: number;
}

export interface CampaignDetail extends Campaign {
  sequence: SequenceStep[];
  engagement: EngagementPoint[];
}

export type ReplyCategory =
  | "interested"
  | "meeting_request"
  | "not_interested"
  | "neutral"
  | "out_of_office"
  | "wrong_person"
  | "do_not_contact";

export interface InboxMessage {
  id: string;
  leadEmail: string;
  leadName: string;
  leadCompany: string;
  campaignId: string;
  campaignName: string;
  subject: string;
  snippet: string;
  body: string;
  receivedAt: string; // ISO
  category: ReplyCategory;
  read: boolean;
}

export type EmailAccountStatus = "active" | "paused" | "error";
export type WarmupStatus = "active" | "paused";

export interface EmailAccount {
  id: string;
  fromEmail: string;
  fromName: string;
  provider: string;
  status: EmailAccountStatus;
  warmupStatus: WarmupStatus;
  warmupReputation: number; // 0..100
  dailyLimit: number;
  sentToday: number;
  deliverabilityScore: number; // 0..100
}

/** Filters carried in the URL on analytics/campaign screens. */
export interface DateRange {
  from: string; // ISO yyyy-mm-dd
  to: string;
}
