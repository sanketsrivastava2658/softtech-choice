"use client";

import { useActionState } from "react";
import { generateAccessLink, type ActionState } from "@/app/(app)/admin/actions";
import { CopyLink } from "./CopyLink";

/**
 * Per-member button that mints a fresh set-password / login link on demand, so
 * an admin can always re-issue access without re-onboarding. Uses the
 * generateAccessLink action (recovery link → production /auth/confirm).
 */
export function MemberAccessLink({ email }: { email: string }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    generateAccessLink,
    {}
  );

  return (
    <div className="flex flex-col gap-1">
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md border border-line px-2.5 py-1 text-[11.5px] font-medium text-muted hover:border-purple hover:text-purple disabled:opacity-60"
        >
          {pending ? "Generating…" : "Get login link"}
        </button>
      </form>
      {state.error && <p className="text-[11.5px] text-red">{state.error}</p>}
      {state.ok && state.link && <CopyLink link={state.link} />}
    </div>
  );
}
