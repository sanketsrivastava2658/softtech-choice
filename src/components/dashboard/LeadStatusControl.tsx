"use client";

import { useRef } from "react";
import { updateLeadStatus } from "@/app/(app)/actions";
import type { LeadStatus } from "@/lib/types";

const STATUSES: LeadStatus[] = [
  "new", "contacted", "replied", "interested", "qualified", "won", "lost",
];

/** Owner/Manager control: change a lead's pipeline stage; submits on change. */
export function LeadStatusControl({
  leadId,
  status,
}: {
  leadId: string;
  status: LeadStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  return (
    <form ref={formRef} action={updateLeadStatus}>
      <input type="hidden" name="lead_id" value={leadId} />
      <select
        name="status"
        defaultValue={status}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-md border border-line bg-surface px-2 py-1 text-[12px] font-medium capitalize text-strong outline-none focus:border-purple"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
