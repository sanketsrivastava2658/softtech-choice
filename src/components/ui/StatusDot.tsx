import type { CampaignStatus } from "@/lib/types";

const COLOR: Record<CampaignStatus, string> = {
  live: "bg-mint",
  warming: "bg-orange",
  paused: "bg-faint",
  completed: "bg-info",
};

/** Small square status indicator used in the campaign table. */
export function StatusDot({ status }: { status: CampaignStatus }) {
  return (
    <span
      className={`inline-block h-[7px] w-[7px] shrink-0 rounded-[2px] ${COLOR[status]}`}
      aria-hidden
    />
  );
}
