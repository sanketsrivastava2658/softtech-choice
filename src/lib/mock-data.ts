import type { ClientOverview } from "./types";

/**
 * Mock fixtures for the client Overview screen.
 *
 * Numbers mirror the design preview so the built screen reads as the same
 * product. Replace this module with a Smartlead-backed loader in Phase 3;
 * the shape (ClientOverview) stays identical.
 */
export const clientOverview: ClientOverview = {
  workspace: { id: "ws_acme", name: "Acme B2B", initials: "AB", kind: "client" },
  syncedAgo: "14s ago",
  metrics: [
    {
      key: "sent",
      label: "Emails Sent",
      value: "48,210",
      spark: [0.22, 0.33, 0.28, 0.5, 0.45, 0.67, 0.61, 0.83],
    },
    {
      key: "open",
      label: "Open Rate",
      value: "61.4%",
      spark: [0.55, 0.5, 0.61, 0.55, 0.72, 0.61, 0.78, 0.72],
    },
    {
      key: "reply",
      label: "Reply Rate",
      value: "7.8%",
      spark: [0.27, 0.38, 0.33, 0.55, 0.61, 0.55, 0.78, 0.9],
      hot: true,
    },
    {
      key: "positive",
      label: "Positive",
      value: "312",
      delta: "+18%",
      deltaDir: "up",
      positive: true,
    },
    {
      key: "booked",
      label: "Meetings",
      value: "29",
      delta: "+6",
      deltaDir: "up",
    },
  ],
  campaigns: [
    {
      id: "cmp_9f3a2",
      name: "Q2 — SaaS Founders",
      detail: "seq · 5 steps",
      status: "live",
      sent: 14920,
      openRate: 63.1,
      replyRate: 8.4,
      positive: 128,
      booked: 11,
    },
    {
      id: "cmp_7b1c8",
      name: "Agency Owners — US",
      detail: "seq · 4 steps",
      status: "live",
      sent: 11305,
      openRate: 59.7,
      replyRate: 7.1,
      positive: 79,
      booked: 8,
    },
    {
      id: "cmp_4d6e1",
      name: "RevOps — Mid-Market",
      detail: "warming · day 6",
      status: "warming",
      sent: 3840,
      openRate: 66.0,
      replyRate: 9.2,
      positive: 52,
      booked: 6,
    },
    {
      id: "cmp_2a9f5",
      name: "Ecom DTC — Repeat",
      detail: "seq · 6 steps",
      status: "live",
      sent: 12460,
      openRate: 57.2,
      replyRate: 6.3,
      positive: 41,
      booked: 3,
    },
    {
      id: "cmp_8c3b7",
      name: "Fintech — Series B",
      detail: "paused · low inbox",
      status: "paused",
      sent: 5685,
      openRate: 48.9,
      replyRate: 4.0,
      positive: 12,
      booked: 1,
    },
  ],
  replies: [
    {
      id: "rpl_1",
      name: "Jordan Kane",
      initials: "JK",
      snippet:
        "This is timely — we're actively scoping outbound for Q3. Can you do Thursday?",
      timeAgo: "2m",
      intent: "meeting",
    },
    {
      id: "rpl_2",
      name: "Priya Menon",
      initials: "PM",
      snippet:
        "Interested. Send over a few times that work and I'll get my ops lead on it.",
      timeAgo: "19m",
      intent: "interested",
    },
    {
      id: "rpl_3",
      name: "Dan Sorensen",
      initials: "DS",
      snippet:
        "Not right now but circle back in September — budget opens then.",
      timeAgo: "1h",
      intent: "later",
    },
  ],
  deliverability: [
    { level: "ok", message: "Inbox health green across 14 mailboxes." },
    { level: "warn", message: "2 mailboxes near daily cap — throttling." },
    { level: "err", message: "Domain blacklist hit on send-acme.com." },
  ],
};
