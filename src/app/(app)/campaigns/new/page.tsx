import Link from "next/link";
import { getActiveWorkspace } from "@/lib/workspace";
import { getAccounts } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { CampaignWizard } from "@/components/campaigns/CampaignWizard";

export default async function NewCampaignPage() {
  const ws = await getActiveWorkspace();
  const accounts = await getAccounts(ws.id);
  const senders = accounts
    .filter((a) => a.status !== "error")
    .map((a) => ({
      id: a.id,
      label: a.fromEmail,
      sub: `${a.provider} · ${a.warmupReputation}%`,
    }));

  return (
    <>
      <Link
        href="/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-purple"
      >
        <Icon name="chevronDown" size={15} className="rotate-90" /> Email Campaigns
      </Link>
      <h1 className="mb-1 text-[20px] font-bold text-ink">New campaign</h1>
      <p className="mb-5 text-[13px] text-muted">
        For <b className="text-strong">{ws.name}</b> — sent through Smartlead behind the scenes.
      </p>
      <CampaignWizard senders={senders} />
    </>
  );
}
