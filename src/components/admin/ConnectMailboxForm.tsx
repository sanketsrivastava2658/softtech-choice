"use client";

import { useActionState } from "react";
import { connectMailbox, type ActionState } from "@/app/(app)/admin/actions";
import { Icon } from "@/components/ui/Icon";

export function ConnectMailboxForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    connectMailbox,
    {}
  );

  return (
    <form action={action} className="rounded-card border border-line bg-surface p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-ink">
        <Icon name="mail" size={16} className="text-purple" />
        Connect a sending mailbox
      </h3>
      <p className="mb-4 text-[12.5px] text-muted">
        SMTP/IMAP credentials are sent to Smartlead under your master account.
      </p>

      <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
        <Field name="from_name" label="From name" placeholder="Sarah at Acme" />
        <Field name="from_email" label="From email" type="email" placeholder="sarah@getacme.io" required />
        <Field name="username" label="Username (often = email)" placeholder="sarah@getacme.io" />
        <Field name="password" label="Password / app password" type="password" required />
        <Field name="smtp_host" label="SMTP host" placeholder="smtp.gmail.com" required />
        <div className="grid grid-cols-2 gap-3">
          <Field name="smtp_port" label="SMTP port" type="number" placeholder="587" />
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
            SMTP security
            <select
              name="smtp_port_type"
              defaultValue="TLS"
              className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
            >
              <option>TLS</option>
              <option>SSL</option>
              <option>NONE</option>
            </select>
          </label>
        </div>
        <Field name="imap_host" label="IMAP host" placeholder="imap.gmail.com" />
        <div className="grid grid-cols-2 gap-3">
          <Field name="imap_port" label="IMAP port" type="number" placeholder="993" />
          <Field name="max_per_day" label="Max / day" type="number" placeholder="50" />
        </div>
      </div>

      {state.error && (
        <p className="mt-3 rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <p className="mt-3 rounded-lg border border-green-line bg-green-soft px-3 py-2 text-[12.5px] text-green">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-purple px-4 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Connecting…" : "Connect mailbox"}
      </button>
    </form>
  );
}

function Field({
  name,
  label,
  placeholder,
  type = "text",
  required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
      />
    </label>
  );
}
