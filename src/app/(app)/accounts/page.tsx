import { getActiveWorkspace } from "@/lib/workspace";
import { getAccounts } from "@/lib/data";
import { fmtInt } from "@/lib/format";
import { PageTitle } from "@/components/ui/PageTitle";
import { Card } from "@/components/ui/Card";
import { AccountBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

function repColor(score: number): string {
  if (score >= 90) return "var(--green)";
  if (score >= 82) return "var(--amber)";
  return "var(--red)";
}

function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div className="h-1.5 w-24 overflow-hidden rounded-full bg-canvas">
      <div
        className="h-full rounded-full"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </div>
  );
}

export default async function AccountsPage() {
  const workspace = await getActiveWorkspace();
  const accounts = await getAccounts(workspace.id);

  const active = accounts.filter((a) => a.status === "active").length;
  const warming = accounts.filter((a) => a.warmupStatus === "active").length;
  const issues = accounts.filter((a) => a.status === "error").length;

  return (
    <>
      <PageTitle title="Email Accounts" />

      <div className="mb-5 grid grid-cols-4 gap-3 max-[760px]:grid-cols-2">
        <Summary label="Connected" value={fmtInt(accounts.length)} />
        <Summary label="Active" value={fmtInt(active)} accent="text-green" />
        <Summary label="Warming up" value={fmtInt(warming)} accent="text-purple" />
        <Summary label="Need attention" value={fmtInt(issues)} accent="text-red" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-faint">
                <Th first>Account</Th>
                <Th>Provider</Th>
                <Th>Status</Th>
                <Th>Warmup</Th>
                <Th>Reputation</Th>
                <Th>Daily usage</Th>
                <Th>Deliverability</Th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {accounts.map((a) => (
                <tr key={a.id} className="hover:bg-hover">
                  <Td first>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-canvas text-faint">
                        <Icon name="mail" size={15} />
                      </span>
                      <div>
                        <div className="num font-semibold text-ink">{a.fromEmail}</div>
                        <div className="text-[12px] text-faint">{a.fromName}</div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-strong">{a.provider}</Td>
                  <Td>
                    <AccountBadge status={a.status} />
                  </Td>
                  <Td>
                    <span
                      className={`inline-flex items-center gap-1.5 text-[12.5px] font-medium ${
                        a.warmupStatus === "active" ? "text-green" : "text-muted"
                      }`}
                    >
                      <span
                        className="inline-block h-1.5 w-1.5 rounded-full"
                        style={{
                          background:
                            a.warmupStatus === "active"
                              ? "var(--green)"
                              : "var(--faint)",
                        }}
                      />
                      {a.warmupStatus === "active" ? "Warming" : "Paused"}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <span className="num text-strong">{a.warmupReputation}%</span>
                      <Meter value={a.warmupReputation} color={repColor(a.warmupReputation)} />
                    </div>
                  </Td>
                  <Td>
                    <span className="num text-strong">
                      {fmtInt(a.sentToday)} / {fmtInt(a.dailyLimit)}
                    </span>
                  </Td>
                  <Td>
                    <span
                      className="num font-semibold"
                      style={{ color: repColor(a.deliverabilityScore) }}
                    >
                      {a.deliverabilityScore}%
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function Summary({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="rounded-card border border-line bg-surface px-4 py-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
        {label}
      </div>
      <div className={`num mt-1.5 text-[24px] font-bold ${accent ?? "text-ink"}`}>
        {value}
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
