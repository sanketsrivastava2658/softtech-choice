import type { Campaign } from "@/lib/types";
import { StatusDot } from "@/components/ui/StatusDot";
import { Badge } from "@/components/ui/Badge";
import { MicroBar } from "@/components/ui/MicroBar";
import { fmtInt, fmtPct } from "@/lib/format";

const FILTERS = ["All", "Live", "Warming", "Paused"];

/** Dense campaigns table — tables are first-class here, not an afterthought. */
export function CampaignTable({ campaigns }: { campaigns: Campaign[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-line">
      <div className="flex items-center justify-between border-b border-line bg-bg px-[14px] py-[11px]">
        <h3 className="text-[13px] font-semibold">Campaigns</h3>
        <div className="flex gap-[6px]">
          {FILTERS.map((f, i) => (
            <span
              key={f}
              className={`cursor-pointer rounded-full border px-[9px] py-[3px] font-mono text-[11px] ${
                i === 0
                  ? "border-amber bg-amber-dim text-amber"
                  : "border-line text-muted"
              }`}
            >
              {f}
            </span>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              <Th first>Campaign</Th>
              <Th>Status</Th>
              <Th>Sent</Th>
              <Th>Open</Th>
              <Th>Reply</Th>
              <Th>Positive</Th>
              <Th>Booked</Th>
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {campaigns.map((c) => (
              <tr key={c.id} className="hover:[&>td]:bg-hover">
                <Td first>
                  <div className="flex items-center gap-[9px]">
                    <StatusDot status={c.status} />
                    <div>
                      <div className="text-[13px] font-medium">{c.name}</div>
                      <span className="block font-mono text-[11px] text-faint">
                        {c.detail}
                      </span>
                    </div>
                  </div>
                </Td>
                <Td>
                  <Badge status={c.status} />
                </Td>
                <Td className="num">{fmtInt(c.sent)}</Td>
                <Td className="num">{fmtPct(c.openRate)}</Td>
                <Td className="num">
                  {fmtPct(c.replyRate)}
                  <MicroBar pct={c.replyRate * 10} />
                </Td>
                <Td className="num text-mint">{c.positive}</Td>
                <Td className="num">{c.booked}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({
  children,
  first,
}: {
  children: React.ReactNode;
  first?: boolean;
}) {
  return (
    <th
      className={`border-b border-line px-[14px] py-[9px] font-mono text-[10px] font-medium uppercase tracking-[0.07em] text-faint ${
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
      className={`border-b border-line px-[14px] py-[11px] align-middle ${
        first ? "text-left" : "text-right"
      } ${className}`}
    >
      {children}
    </td>
  );
}
