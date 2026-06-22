"use client";

import { useActionState } from "react";
import { onboardClient, type ActionState } from "@/app/(app)/admin/actions";
import { Icon } from "@/components/ui/Icon";
import { CopyLink } from "./CopyLink";

export function OnboardClientForm() {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    onboardClient,
    {}
  );

  return (
    <form action={action} className="rounded-card border border-line bg-surface p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-ink">
        <Icon name="building" size={16} className="text-purple" />
        Onboard a new client
      </h3>
      <p className="mb-4 text-[12.5px] text-muted">
        Creates an isolated Smartlead white-label client, a login, and a workspace.
      </p>

      <div className="grid grid-cols-3 gap-3 max-[760px]:grid-cols-1">
        <Field name="name" label="Client / company name" placeholder="Acme B2B" required />
        <Field name="email" label="Client login email" type="email" placeholder="ops@acme.com" required />
        <Field name="domain" label="Primary sending domain (optional)" placeholder="getacme.io" />
      </div>

      {state.error && (
        <p className="mt-3 rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
          {state.error}
        </p>
      )}
      {state.ok && state.message && (
        <div className="mt-3 rounded-lg border border-green-line bg-green-soft px-3 py-2.5">
          <p className="text-[12.5px] font-medium text-green">{state.message}</p>
          {state.link && <CopyLink link={state.link} />}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-4 rounded-lg bg-purple px-4 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Onboarding…" : "Onboard client"}
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
