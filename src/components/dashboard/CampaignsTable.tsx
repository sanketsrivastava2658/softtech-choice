"use client";

import { useState } from "react";
import Link from "next/link";
import type { Campaign, CampaignStatus } from "@/lib/types";
import { fmtInt, fmtPct } from "@/lib/format";
import { CampaignBadge } from "@/components/ui/Badge";

const FILTERS: { label: string; match: (s: CampaignStatus) => boolean }[] = [
  { label: "All", match: () => true },
  { label: "Active", match: (s) => s === "active" },
  { label: "Warming", match: (s) => s === "warming" },
  { label: "Paused", match: (s) => s === "paused" },
  { label: "Completed", match: (s) => s === "completed" },
];

export function CampaignsTable({ campaigns }: { campaigns: Campaign[] }) {
  const [filter, setFilter] = useState(0);
  const rows = campaigns.filter((c) => FILTERS[filter].match(c.status));

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        {FILTERS.map((f, i) => (
          <button
            key={f.label}
            onClick={() => setFilter(i)}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-medium ${
              i === filter
                ? "border-purple-line bg-purple-soft text-purple"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
        <span className="num ml-auto text-[12.5px] text-faint">
          {rows.length} campaigns
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="text-faint">
              <Th first>Campaign</Th>
              <Th>Status</Th>
              <Th>Leads</Th>
              <Th>Sent</Th>
              <Th>Open</Th>
              <Th>Reply</Th>
              <Th>Positive</Th>
              <Th>Bounce</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-hover">
                <Td first>
                  <Link
                    href={`/campaigns/${c.id}`}
                    className="font-semibold text-ink hover:text-purple"
                  >
                    {c.name}
                  </Link>
                </Td>
                <Td>
                  <CampaignBadge status={c.status} />
                </Td>
                <Td className="num text-strong">{fmtInt(c.leadCount)}</Td>
                <Td className="num text-strong">{fmtInt(c.sentCount)}</Td>
                <Td className="num text-strong">{fmtPct(c.openRate, 1)}</Td>
                <Td className="num font-semibold text-teal">
                  {fmtPct(c.replyRate, 1)}
                </Td>
                <Td className="num font-semibold text-green">
                  {fmtPct(c.positiveReplyRate, 1)}
                </Td>
                <Td className="num text-strong">{fmtPct(c.bounceRate, 1)}</Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-muted">
                  No campaigns in this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <th
      className={`border-b border-line px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${
        first ? "text-left" : "text-right"
      }`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  first,
  className = "",
}: {
  children: React.ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <td
      className={`border-b border-line px-4 py-3 align-middle ${
        first ? "text-left" : "text-right"
      } ${className}`}
    >
      {children}
    </td>
  );
}
