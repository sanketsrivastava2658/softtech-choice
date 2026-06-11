import type { CampaignStatus } from "@/lib/types";

const STYLE: Record<CampaignStatus, string> = {
  live: "text-mint border-mint-line",
  warming: "text-orange border-orange-line",
  paused: "text-faint border-line",
  completed: "text-info border-line",
};

const LABEL: Record<CampaignStatus, string> = {
  live: "Live",
  warming: "Warming",
  paused: "Paused",
  completed: "Done",
};

/** Mono status badge with a semantic border — never a filled pill (DESIGN.md). */
export function Badge({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-block rounded-chip border px-[7px] py-[2px] font-mono text-[10px] uppercase tracking-[0.05em] ${STYLE[status]}`}
    >
      {LABEL[status]}
    </span>
  );
}
