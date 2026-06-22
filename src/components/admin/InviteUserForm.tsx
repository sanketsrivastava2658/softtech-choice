"use client";

import { useActionState } from "react";
import { inviteUserToWorkspace, type ActionState } from "@/app/(app)/admin/actions";
import { CopyLink } from "./CopyLink";

export function InviteUserForm({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    inviteUserToWorkspace,
    {}
  );

  return (
    <div className="border-t border-line px-5 py-4">
      <form action={action} className="flex items-end gap-2">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <label className="flex flex-1 flex-col gap-1.5 text-[12.5px] font-medium text-strong">
          Invite a user to this client
          <input
            name="email"
            type="email"
            required
            placeholder="person@client.com"
            className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-purple px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "…" : "Invite"}
        </button>
      </form>

      {state.error && (
        <p className="mt-2 rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
          {state.error}
        </p>
      )}
      {state.ok && (
        <div className="mt-2">
          <p className="text-[12.5px] font-medium text-green">{state.message}</p>
          {state.link && <CopyLink link={state.link} />}
        </div>
      )}
    </div>
  );
}
