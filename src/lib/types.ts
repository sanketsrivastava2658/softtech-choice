/**
 * Domain types for Outbound Terminal.
 *
 * Shaped to mirror the Smartlead API surface so that swapping mock fixtures for
 * the live client (Phase 2/3) is a data-source change, not a UI change. Names
 * follow Smartlead vocabulary: campaigns, sequences, leads, replies.
 */

export type CampaignStatus = "live" | "warming" | "paused" | "completed";

export type ReplyIntent = "meeting" | "interested" | "later" | "not-interested";

/** A single outbound campaign as the client sees it on the dashboard. */
export interface Campaign {
  id: string;
  name: string;
  /** e.g. "seq · 5 steps" or "warming · day 6" — short context line under the name */
  detail: string;
  status: CampaignStatus;
  sent: number;
  openRate: number; // 0–100
  replyRate: number; // 0–100 (the money metric)
  positive: number; // positive reply count
  booked: number; // meetings booked
}

/** One tile in the command strip — a poster of a single live number. */
export interface Metric {
  key: string;
  label: string;
  /** preformatted display value, e.g. "48,210" or "7.8%" */
  value: string;
  /** sparkline points, 0–1 normalized; rendered right-to-latest */
  spark?: number[];
  /** period-over-period delta, e.g. "+18%" */
  delta?: string;
  deltaDir?: "up" | "down";
  /** emphasize in amber — reserved for the one money metric (reply rate) */
  hot?: boolean;
  /** tint the value in the positive (mint) color */
  positive?: boolean;
}

/** A positive/relevant reply surfaced in the live replies rail. */
export interface Reply {
  id: string;
  name: string;
  initials: string;
  snippet: string;
  timeAgo: string;
  intent: ReplyIntent;
}

export type AlertLevel = "ok" | "warn" | "err";

/** A deliverability / inbox-health signal. */
export interface DeliverabilitySignal {
  level: AlertLevel;
  message: string;
}

/** The tenant currently in view (a client workspace, or the agency rollup). */
export interface Workspace {
  id: string;
  name: string;
  initials: string;
  /** which surface this workspace is viewed through */
  kind: "client" | "agency";
}

/** Everything the client Overview screen needs, in one payload. */
export interface ClientOverview {
  workspace: Workspace;
  syncedAgo: string;
  metrics: Metric[];
  campaigns: Campaign[];
  replies: Reply[];
  deliverability: DeliverabilitySignal[];
}
