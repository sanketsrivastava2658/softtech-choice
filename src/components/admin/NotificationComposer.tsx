"use client";

import { useActionState } from "react";
import { postNotification, type ActionState } from "@/app/(app)/admin/actions";

export function NotificationComposer({ workspaceId }: { workspaceId: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    postNotification,
    {}
  );

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="border-b border-line px-5 py-3 text-[13px] font-bold text-ink">
        Send a notification
      </div>
      <form action={action} className="flex flex-col gap-3 px-5 py-4">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <div className="flex gap-2">
          <label className="flex flex-1 flex-col gap-1.5 text-[12.5px] font-medium text-strong">
            Title
            <input
              name="title"
              required
              placeholder="Monthly report is ready"
              className="rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
            Level
            <select
              name="level"
              defaultValue="info"
              className="rounded-lg border border-line px-3 py-2 text-[13.5px] capitalize outline-none focus:border-purple"
            >
              <option value="info">Info</option>
              <option value="success">Success</option>
              <option value="warning">Warning</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-[12.5px] font-medium text-strong">
          Message
          <textarea
            name="body"
            rows={2}
            placeholder="Optional detail for the client…"
            className="resize-y rounded-lg border border-line px-3 py-2 text-[13.5px] outline-none focus:border-purple"
          />
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-purple px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
          >
            {pending ? "…" : "Send to client"}
          </button>
          {state.error && <span className="text-[12.5px] text-red">{state.error}</span>}
          {state.ok && <span className="text-[12.5px] text-green">{state.message}</span>}
        </div>
      </form>
    </div>
  );
}
