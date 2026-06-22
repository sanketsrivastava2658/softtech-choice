import Link from "next/link";
import { notFound } from "next/navigation";
import { getActiveWorkspace } from "@/lib/workspace";
import { getCampaign } from "@/lib/data";
import { fmtInt, fmtPct } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { Card, CardHeader } from "@/components/ui/Card";
import { CampaignBadge } from "@/components/ui/Badge";
import { EngagementChart } from "@/components/dashboard/EngagementChart";

function Metric({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
        {label}
      </div>
      <div className={`num mt-1.5 text-[22px] font-bold ${accent ?? "text-ink"}`}>
        {value}
      </div>
    </div>
  );
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workspace = await getActiveWorkspace();
  const campaign = await getCampaign(workspace.id, id);
  if (!campaign) notFound();

  return (
    <>
      <Link
        href="/campaigns"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-purple"
      >
        <Icon name="chevronDown" size={15} className="rotate-90" />
        Email Campaigns
      </Link>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="text-[22px] font-bold text-ink">{campaign.name}</h1>
        <CampaignBadge status={campaign.status} />
        <span className="num ml-auto text-[12.5px] text-faint">{campaign.id}</span>
      </div>

      <div className="mb-7 grid grid-cols-4 gap-3 max-[760px]:grid-cols-2">
        <Metric label="Leads" value={fmtInt(campaign.leadCount)} />
        <Metric label="Sent" value={fmtInt(campaign.sentCount)} />
        <Metric label="Open Rate" value={fmtPct(campaign.openRate, 1)} />
        <Metric label="Reply Rate" value={fmtPct(campaign.replyRate, 1)} accent="text-teal" />
      </div>

      {campaign.engagement.length > 0 && (
        <Card className="mb-7">
          <CardHeader title="Engagement" info />
          <div className="px-5 py-5">
            <EngagementChart data={campaign.engagement} />
          </div>
        </Card>
      )}

      <Card>
        <CardHeader title="Sequence" subtitle="Steps and per-step performance" />
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-faint">
                <th className="border-b border-line px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                  Step
                </th>
                <th className="border-b border-line px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">
                  Subject
                </th>
                <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                  Delay
                </th>
                <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                  Sent
                </th>
                <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                  Open
                </th>
                <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">
                  Reply
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {campaign.sequence.map((s) => (
                <tr key={s.stepNumber} className="hover:bg-hover">
                  <td className="num border-b border-line px-5 py-3 font-semibold text-ink">
                    {s.stepNumber}
                  </td>
                  <td className="border-b border-line px-5 py-3 text-strong">
                    {s.subject}
                  </td>
                  <td className="num border-b border-line px-5 py-3 text-right text-strong">
                    {s.delayDays === 0 ? "—" : `${s.delayDays}d`}
                  </td>
                  <td className="num border-b border-line px-5 py-3 text-right text-strong">
                    {fmtInt(s.sentCount)}
                  </td>
                  <td className="num border-b border-line px-5 py-3 text-right text-strong">
                    {fmtPct(s.openRate, 1)}
                  </td>
                  <td className="num border-b border-line px-5 py-3 text-right font-semibold text-teal">
                    {fmtPct(s.replyRate, 1)}
                  </td>
                </tr>
              ))}
              {campaign.sequence.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">
                    Sequence detail syncs from Smartlead with the next pass.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
