import { masterClient } from "@/lib/credentials";
import type { EmailAccount } from "@/lib/types";
import { fmtInt } from "@/lib/format";
import { ConnectMailboxForm } from "@/components/admin/ConnectMailboxForm";
import { AccountBadge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";

export default async function AdminMailboxesPage() {
  let mailboxes: EmailAccount[] = [];
  let liveError = false;
  const master = await masterClient();
  if (master) {
    try {
      mailboxes = await master.listEmailAccounts();
    } catch {
      liveError = true;
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ConnectMailboxForm />

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-[14px] font-bold text-ink">Connected mailboxes</h3>
          <span className="num text-[12.5px] text-faint">{mailboxes.length}</span>
        </div>

        {mailboxes.length === 0 ? (
          <div className="flex items-center gap-2 px-5 py-8 text-[13px] text-muted">
            <Icon name="info" size={15} className="text-faint" />
            {master
              ? liveError
                ? "Couldn't reach Smartlead with the master key."
                : "No mailboxes connected yet. Add one above."
              : "Set the master Smartlead key under Credentials to list and connect mailboxes."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="text-faint">
                  <th className="border-b border-line px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Mailbox</th>
                  <th className="border-b border-line px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Provider</th>
                  <th className="border-b border-line px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide">Status</th>
                  <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Reputation</th>
                  <th className="border-b border-line px-5 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide">Daily limit</th>
                </tr>
              </thead>
              <tbody className="[&>tr:last-child>td]:border-b-0">
                {mailboxes.map((m) => (
                  <tr key={m.id} className="hover:bg-hover">
                    <td className="num border-b border-line px-5 py-3 font-semibold text-ink">{m.fromEmail}</td>
                    <td className="border-b border-line px-5 py-3 text-strong">{m.provider}</td>
                    <td className="border-b border-line px-5 py-3"><AccountBadge status={m.status} /></td>
                    <td className="num border-b border-line px-5 py-3 text-right text-strong">{m.warmupReputation}%</td>
                    <td className="num border-b border-line px-5 py-3 text-right text-strong">{fmtInt(m.dailyLimit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
