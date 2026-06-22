import type { CampaignStatus, EmailAccountStatus, ReplyCategory } from "@/lib/types";

const CAMPAIGN: Record<CampaignStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-soft text-green border-green-line" },
  warming: { label: "Warming", cls: "bg-purple-soft text-purple border-purple-line" },
  paused: { label: "Paused", cls: "bg-canvas text-muted border-line" },
  completed: { label: "Completed", cls: "bg-teal-soft text-teal border-teal-line" },
  draft: { label: "Draft", cls: "bg-canvas text-faint border-line" },
};

const ACCOUNT: Record<EmailAccountStatus, { label: string; cls: string }> = {
  active: { label: "Active", cls: "bg-green-soft text-green border-green-line" },
  paused: { label: "Paused", cls: "bg-canvas text-muted border-line" },
  error: { label: "Error", cls: "bg-red-soft text-red border-red-line" },
};

const CATEGORY: Record<ReplyCategory, { label: string; cls: string }> = {
  interested: { label: "Interested", cls: "bg-green-soft text-green border-green-line" },
  meeting_request: { label: "Meeting", cls: "bg-purple-soft text-purple border-purple-line" },
  not_interested: { label: "Not interested", cls: "bg-canvas text-muted border-line" },
  neutral: { label: "Neutral", cls: "bg-canvas text-muted border-line" },
  out_of_office: { label: "Out of office", cls: "bg-teal-soft text-teal border-teal-line" },
  wrong_person: { label: "Wrong person", cls: "bg-canvas text-muted border-line" },
  do_not_contact: { label: "Do not contact", cls: "bg-red-soft text-red border-red-line" },
};

function Pill({ label, cls }: { label: string; cls: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${cls}`}
    >
      {label}
    </span>
  );
}

export function CampaignBadge({ status }: { status: CampaignStatus }) {
  return <Pill {...CAMPAIGN[status]} />;
}
export function AccountBadge({ status }: { status: EmailAccountStatus }) {
  return <Pill {...ACCOUNT[status]} />;
}
export function CategoryBadge({ category }: { category: ReplyCategory }) {
  return <Pill {...CATEGORY[category]} />;
}
