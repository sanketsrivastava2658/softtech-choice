import type { Invoice, InvoiceStatus } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  draft: "border-line bg-canvas text-muted",
  due: "border-amber/30 bg-amber/10 text-amber",
  paid: "border-green-line bg-green-soft text-green",
  void: "border-line bg-canvas text-faint line-through",
};

export function BillingView({ invoices }: { invoices: Invoice[] }) {
  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-6 py-16 text-center">
        <Icon name="dollar" size={24} className="text-faint" />
        <p className="text-[14px] font-semibold text-ink">No invoices yet</p>
        <p className="max-w-sm text-[12.5px] text-muted">
          Invoices issued by your agency will appear here.
        </p>
      </div>
    );
  }

  const currency = invoices[0]?.currency ?? "USD";
  const outstanding = invoices
    .filter((i) => i.status === "due")
    .reduce((s, i) => s + i.amountCents, 0);
  const paid = invoices
    .filter((i) => i.status === "paid")
    .reduce((s, i) => s + i.amountCents, 0);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-4 max-[560px]:grid-cols-1">
        <div className="rounded-card border border-line bg-surface px-5 py-4">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
            Outstanding
          </div>
          <div className="num mt-1 text-[22px] font-bold text-ink">
            {fmtMoney(outstanding, currency)}
          </div>
        </div>
        <div className="rounded-card border border-line bg-surface px-5 py-4">
          <div className="text-[11.5px] font-semibold uppercase tracking-wide text-faint">
            Paid to date
          </div>
          <div className="num mt-1 text-[22px] font-bold text-green">
            {fmtMoney(paid, currency)}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="border-b border-line px-5 py-3 text-[13px] font-bold text-ink">
          Invoices <span className="num text-faint">· {invoices.length}</span>
        </div>
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line text-[11px] font-semibold uppercase tracking-wide text-faint">
                <th className="px-5 py-2.5">Invoice</th>
                <th className="px-5 py-2.5">Issued</th>
                <th className="px-5 py-2.5">Due</th>
                <th className="px-5 py-2.5 text-right">Amount</th>
                <th className="px-5 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-line last:border-b-0 hover:bg-hover">
                  <td className="px-5 py-3">
                    <div className="num text-[13px] font-medium text-ink">{inv.number}</div>
                    {inv.notes && <div className="text-[11.5px] text-faint">{inv.notes}</div>}
                  </td>
                  <td className="px-5 py-3">
                    <span className="num text-[12.5px] text-muted">{fmtDate(inv.issuedAt)}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="num text-[12.5px] text-muted">
                      {inv.dueAt ? fmtDate(inv.dueAt) : "—"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <span className="num text-[13px] font-semibold text-ink">
                      {fmtMoney(inv.amountCents, inv.currency)}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLE[inv.status]}`}
                    >
                      {inv.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
