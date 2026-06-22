"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

interface Opt {
  id: string;
  name: string;
}

const PRESETS = [
  { label: "Last 7 days", days: 7 },
  { label: "Last 30 days", days: 30 },
  { label: "Last 90 days", days: 90 },
];

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export function AnalyticsFilters({
  campaigns,
  from,
  to,
  campaignId,
}: {
  campaigns: Opt[];
  from: string;
  to: string;
  campaignId?: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [openDate, setOpenDate] = useState(false);
  const [openCamp, setOpenCamp] = useState(false);

  function update(next: Record<string, string | undefined>) {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v);
      else p.delete(k);
    }
    router.push(`?${p.toString()}`);
  }

  const activeCampaign = campaigns.find((c) => c.id === campaignId);

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* date range */}
      <div className="relative">
        <button
          onClick={() => {
            setOpenDate((o) => !o);
            setOpenCamp(false);
          }}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-strong hover:bg-hover"
        >
          <Icon name="calendar" size={15} className="text-faint" />
          {from} — {to}
          <Icon name="chevronDown" size={14} className="text-faint" />
        </button>
        {openDate && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenDate(false)} />
            <div className="absolute z-30 mt-2 w-72 rounded-xl border border-line bg-surface p-3 shadow-lg shadow-black/10">
              <div className="mb-2 flex flex-col gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.days}
                    onClick={() => {
                      update({ from: isoDaysAgo(p.days), to: isoDaysAgo(0) });
                      setOpenDate(false);
                    }}
                    className="rounded-lg px-2.5 py-1.5 text-left text-[13px] text-strong hover:bg-hover"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-line pt-3">
                <input
                  type="date"
                  defaultValue={from}
                  onChange={(e) => update({ from: e.target.value })}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-[12.5px]"
                />
                <span className="text-faint">—</span>
                <input
                  type="date"
                  defaultValue={to}
                  onChange={(e) => update({ to: e.target.value })}
                  className="w-full rounded-lg border border-line px-2 py-1.5 text-[12.5px]"
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* campaign filter */}
      <div className="relative">
        <button
          onClick={() => {
            setOpenCamp((o) => !o);
            setOpenDate(false);
          }}
          className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] font-medium text-strong hover:bg-hover"
        >
          <Icon name="filter" size={15} className="text-faint" />
          {activeCampaign ? activeCampaign.name : "All Campaigns"}
          <Icon name="chevronDown" size={14} className="text-faint" />
        </button>
        {openCamp && (
          <>
            <div className="fixed inset-0 z-20" onClick={() => setOpenCamp(false)} />
            <div className="absolute right-0 z-30 mt-2 max-h-72 w-64 overflow-y-auto rounded-xl border border-line bg-surface py-1.5 shadow-lg shadow-black/10">
              <button
                onClick={() => {
                  update({ campaign: undefined });
                  setOpenCamp(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-strong hover:bg-hover"
              >
                All Campaigns
                {!campaignId && <Icon name="check" size={15} className="text-purple" />}
              </button>
              {campaigns.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    update({ campaign: c.id });
                    setOpenCamp(false);
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-strong hover:bg-hover"
                >
                  <span className="truncate">{c.name}</span>
                  {c.id === campaignId && (
                    <Icon name="check" size={15} className="flex-none text-purple" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
