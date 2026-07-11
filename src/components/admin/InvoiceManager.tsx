"use client";

import { useActionState } from "react";
import {
  createInvoice,
  setInvoiceStatus,
  type ActionState,
} from "@/app/(app)/admin/actions";
import type { Invoice } from "@/lib/types";
import { fmtDate, fmtMoney } from "@/lib/format";

function StatusForm({
  invoice,
  workspaceId,
  next,
  label,
}: {
  invoice: Invoice;
  workspaceId: string;
  next: string;
  label: string;
}) {
  const [, action] = useActionState<ActionState, FormData>(setInvoiceStatus, {});
  return (
    <form action={action}>
      <input type="hidden" name="invoice_id" value={invoice.id} />
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="status" value={next} />
      <button
        type="submit"
        className="rounded-md border border-line px-2 py-1 text-[11px] font-medium text-muted hover:border-purple hover:text-purple"
      >
        {label}
      </button>
    </form>
  );
}

export function InvoiceManager({
  workspaceId,
  invoices,
}: {
  workspaceId: string;
  invoices: Invoice[];
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    createInvoice,
    {}
  );

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line px-5 py-3 text-[13px] font-bold text-ink">
        Billing &amp; invoices
      </div>

      {invoices.length > 0 && (
        <ul>
          {invoices.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center gap-3 border-b border-line px-5 py-2.5 last:border-b-0"
            >
              <div className="min-w-0 flex-1">
                <div className="num text-[13px] font-medium text-ink">{inv.number}</div>
                <div className="text-[11.5px] text-faint">
                  Issued {fmtDate(inv.issuedAt)}
                  {inv.dueAt ? ` · due ${fmtDate(inv.dueAt)}` : ""}
                </div>
              </div>
              <span className="num text-[13px] font-semibold text-ink">
                {fmtMoney(inv.amountCents, inv.currency)}
              </span>
              <span
                className={`w-14 text-center text-[11px] font-semibold capitalize ${
                  inv.status === "paid"
                    ? "text-green"
                    : inv.status === "due"
                    ? "text-amber"
                    : "text-faint"
                }`}
              >
                {inv.status}
              </span>
              {inv.status !== "paid" ? (
                <StatusForm invoice={inv} workspaceId={workspaceId} next="paid" label="Mark paid" />
              ) : (
                <StatusForm invoice={inv} workspaceId={workspaceId} next="due" label="Reopen" />
              )}
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="flex flex-wrap items-end gap-2 border-t border-line px-5 py-4">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-strong">
          Number
          <input
            name="number"
            required
            placeholder="INV-2026001"
            className="w-32 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-purple"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-strong">
          Amount
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required
            placeholder="2500.00"
            className="num w-28 rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-purple"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12px] font-medium text-strong">
          Due date
          <input
            name="due_at"
            type="date"
            className="num rounded-lg border border-line px-3 py-2 text-[13px] outline-none focus:border-purple"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-purple px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Add invoice"}
        </button>
        {state.error && <span className="w-full text-[12px] text-red">{state.error}</span>}
        {state.ok && <span className="w-full text-[12px] text-green">{state.message}</span>}
      </form>
    </div>
  );
}
