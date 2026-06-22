"use client";

import { useActionState, useState, useTransition } from "react";
import {
  saveSettings,
  testConnection,
  type ActionState,
} from "@/app/(app)/admin/actions";
import { Icon } from "@/components/ui/Icon";

export function SettingsForm({
  configured,
  maskedKey,
  baseUrl,
}: {
  configured: boolean;
  maskedKey: string;
  baseUrl: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    saveSettings,
    {}
  );
  const [testState, setTestState] = useState<ActionState>({});
  const [testing, startTest] = useTransition();

  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <h3 className="mb-1 flex items-center gap-2 text-[14px] font-bold text-ink">
        <Icon name="building" size={16} className="text-purple" />
        Smartlead master credentials
      </h3>
      <p className="mb-4 text-[12.5px] text-muted">
        Your agency account key. Used to create clients and connect mailboxes.
        {configured && (
          <span className="ml-1 font-medium text-green">
            Currently configured ({maskedKey}).
          </span>
        )}
      </p>

      <form action={action} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
          Master API key
          <input
            name="master_key"
            type="password"
            required
            placeholder={configured ? "•••• (enter to replace)" : "smartlead master api key"}
            className="num rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
          Base URL
          <input
            name="base_url"
            defaultValue={baseUrl}
            className="num rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
          />
        </label>

        {state.error && (
          <p className="rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
            {state.error}
          </p>
        )}
        {state.ok && state.message && (
          <p className="rounded-lg border border-green-line bg-green-soft px-3 py-2 text-[12.5px] text-green">
            {state.message}
          </p>
        )}

        <div className="flex items-center gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-purple px-4 py-2.5 text-[13.5px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "Validating…" : "Validate & save"}
          </button>
          <button
            type="button"
            disabled={testing || !configured}
            onClick={() => startTest(async () => setTestState(await testConnection()))}
            className="rounded-lg border border-line px-4 py-2.5 text-[13.5px] font-medium text-strong hover:bg-hover disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
        </div>

        {testState.error && (
          <p className="text-[12.5px] text-red">{testState.error}</p>
        )}
        {testState.ok && testState.message && (
          <p className="text-[12.5px] text-green">{testState.message}</p>
        )}
      </form>
    </div>
  );
}
