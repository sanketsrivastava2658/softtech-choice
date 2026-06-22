import { getActiveWorkspace } from "@/lib/workspace";
import { getAnalytics, getCampaigns } from "@/lib/data";
import { fmtInt, fmtPct } from "@/lib/format";
import { PageTitle } from "@/components/ui/PageTitle";
import { Banner } from "@/components/ui/Banner";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { EngagementChart } from "@/components/dashboard/EngagementChart";
import { AnalyticsFilters } from "@/components/dashboard/AnalyticsFilters";

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString().slice(0, 10);
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; campaign?: string }>;
}) {
  const sp = await searchParams;
  const from = sp.from ?? isoDaysAgo(30);
  const to = sp.to ?? isoDaysAgo(0);
  const campaignId = sp.campaign;

  const workspace = await getActiveWorkspace();
  const [{ summary, engagement, mode }, campaigns] = await Promise.all([
    getAnalytics(workspace.id, { from, to }, campaignId),
    getCampaigns(workspace.id),
  ]);

  return (
    <>
      <PageTitle
        title="Performance Metrics"
        right={
          <AnalyticsFilters
            campaigns={campaigns.map((c) => ({ id: c.id, name: c.name }))}
            from={from}
            to={to}
            campaignId={campaignId}
          />
        }
      />

      {mode === "demo" && (
        <Banner message="Demo data loaded successfully. Connect your Smartlead key to see live numbers." />
      )}

      {/* headline metrics */}
      <div className="mb-7 grid grid-cols-5 gap-4 max-[1100px]:grid-cols-2 max-[560px]:grid-cols-1">
        <StatCard
          tone="purple"
          icon="mail"
          label="Emails Sent"
          value={fmtInt(summary.emailsSent)}
          subValue={fmtInt(summary.leads)}
          subLabel="Leads (Active + Inactive)"
        />
        <StatCard
          tone="purple"
          icon="mailOpen"
          label="Opened"
          value={fmtInt(summary.opened)}
          subValue={fmtPct(summary.openRate)}
          subLabel="Open Rate"
        />
        <StatCard
          tone="teal"
          icon="reply"
          label="Replied"
          value={fmtInt(summary.replied)}
          subValue={fmtPct(summary.replyRate)}
          subLabel="Reply Rate"
        />
        <StatCard
          tone="green"
          icon="dollar"
          label="Positive Reply"
          value={fmtInt(summary.positiveReplies)}
          subValue={fmtPct(summary.positiveReplyRate)}
          subLabel="Positive Reply Rate"
        />
        <StatCard
          tone="red"
          icon="bounce"
          label="Bounced"
          value={fmtInt(summary.bounced)}
          subValue={fmtPct(summary.bounceRate)}
          subLabel="Bounce Rate"
        />
      </div>

      <Card>
        <CardHeader
          title="Email Engagement Metrics"
          info
          subtitle={
            <span>
              The data is displayed in <b className="text-strong">Etc/GMT(UTC)</b>
            </span>
          }
        />
        <div className="px-5 py-5">
          <EngagementChart data={engagement} />
        </div>
      </Card>
    </>
  );
}
