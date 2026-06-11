import { AppShell } from "@/components/app/AppShell";
import { CommandStrip } from "@/components/dashboard/CommandStrip";
import { CampaignTable } from "@/components/dashboard/CampaignTable";
import { RepliesPanel } from "@/components/dashboard/RepliesPanel";
import { Alert } from "@/components/ui/Alert";
import { clientOverview } from "@/lib/mock-data";

export default function ClientOverviewPage() {
  const { workspace, syncedAgo, metrics, campaigns, replies, deliverability } =
    clientOverview;

  return (
    <AppShell
      workspace={workspace}
      rightPanel={<RepliesPanel replies={replies} />}
    >
      {/* breadcrumb + live sync state */}
      <div className="mb-[14px] flex items-center gap-2 font-mono text-[12px] text-faint">
        <span>Overview</span>
        <span>/</span>
        <b className="font-medium text-text">Last 30 days</b>
        <span className="ml-auto flex items-center gap-[6px]">
          <span className="pulse" />
          Live · synced {syncedAgo}
        </span>
      </div>

      <CommandStrip metrics={metrics} />

      <CampaignTable campaigns={campaigns} />

      {/* deliverability signals — part of an honest ops overview */}
      <section className="mt-5">
        <h3 className="mb-[10px] font-mono text-[11px] uppercase tracking-[0.12em] text-faint">
          Deliverability
        </h3>
        <div className="grid gap-[8px] min-[680px]:grid-cols-3">
          {deliverability.map((d, i) => (
            <Alert key={i} level={d.level}>
              {d.message}
            </Alert>
          ))}
        </div>
      </section>

      <p className="mt-7 font-mono text-[11px] text-faint">
        Mock data · Smartlead-shaped. Auth, RLS, and live sync wire in the next
        pass.
      </p>
    </AppShell>
  );
}
