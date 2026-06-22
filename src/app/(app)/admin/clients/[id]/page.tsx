import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspace, getCampaigns, getAccounts } from "@/lib/data";
import { listWorkspaceMembers } from "@/lib/access";
import { fmtInt } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { InviteUserForm } from "@/components/admin/InviteUserForm";

function mask(key?: string | null): string {
  if (!key) return "—";
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-3 last:border-b-0">
      <span className="text-[12.5px] text-muted">{label}</span>
      <span className="text-[13px] font-medium text-ink">{value}</span>
    </div>
  );
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ws = await getWorkspace(id);
  if (!ws || ws.id !== id) notFound();

  const [campaigns, accounts, members] = await Promise.all([
    getCampaigns(id),
    getAccounts(id),
    listWorkspaceMembers(id),
  ]);
  const live = Boolean(ws.smartleadApiKey);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted hover:text-purple"
      >
        <Icon name="chevronDown" size={15} className="rotate-90" /> Clients
      </Link>

      <div className="flex items-center gap-3">
        <h2 className="text-[20px] font-bold text-ink">{ws.name}</h2>
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${
            live ? "border-green-line bg-green-soft text-green" : "border-line bg-canvas text-muted"
          }`}
        >
          {live ? "Live" : "Demo"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-5 max-[820px]:grid-cols-1">
        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="border-b border-line px-5 py-3 text-[13px] font-bold text-ink">
            Smartlead binding
          </div>
          <Row label="Smartlead client ID" value={ws.smartleadClientId ? `#${ws.smartleadClientId}` : "—"} />
          <Row label="Client API key" value={<span className="num">{mask(ws.smartleadApiKey)}</span>} />
          <Row label="Primary domain" value={ws.primaryDomain ?? "—"} />
          <Row label="Status" value={ws.status ?? "active"} />
        </div>

        <div className="overflow-hidden rounded-card border border-line bg-surface">
          <div className="border-b border-line px-5 py-3 text-[13px] font-bold text-ink">
            Footprint
          </div>
          <Row label="Campaigns" value={<span className="num">{fmtInt(campaigns.length)}</span>} />
          <Row
            label="Sending mailboxes"
            value={<span className="num">{fmtInt(accounts.length)}</span>}
          />
          <Row
            label="Leads (all campaigns)"
            value={<span className="num">{fmtInt(campaigns.reduce((s, c) => s + c.leadCount, 0))}</span>}
          />
          <Row
            label="Emails sent"
            value={<span className="num">{fmtInt(campaigns.reduce((s, c) => s + c.sentCount, 0))}</span>}
          />
        </div>
      </div>

      {/* users & access */}
      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-[13px] font-bold text-ink">Users &amp; access</h3>
          <span className="num text-[12.5px] text-faint">{members.length}</span>
        </div>

        {members.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-4 text-[12.5px] text-muted">
            <Icon name="info" size={15} className="text-faint" />
            {ws.smartleadApiKey || ws.smartleadClientId
              ? "No users yet — invite someone below."
              : "Connect Supabase and onboard this client to manage real logins. Invite is disabled in demo."}
          </div>
        ) : (
          <ul>
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-3 border-b border-line px-5 py-3 last:border-b-0"
              >
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-canvas text-[11px] font-semibold text-strong">
                  {(m.fullName || m.email || "?").charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-ink">
                    {m.fullName || m.email}
                  </div>
                  <div className="num truncate text-[12px] text-faint">{m.email}</div>
                </div>
                <span
                  className={`ml-auto rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                    m.role === "super_admin"
                      ? "border-purple-line bg-purple-soft text-purple"
                      : "border-line bg-canvas text-muted"
                  }`}
                >
                  {m.role === "super_admin" ? "Super admin" : m.role === "agency_admin" ? "Agency" : "Client"}
                </span>
              </li>
            ))}
          </ul>
        )}

        <InviteUserForm workspaceId={ws.id} />
      </div>

      <p className="text-[12px] text-faint">
        Manage this client&apos;s campaigns and inbox by switching to their
        workspace from the top bar.
      </p>
    </div>
  );
}
