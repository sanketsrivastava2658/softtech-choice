"use client";

import { useActionState } from "react";
import { updatePassword, type PwState } from "@/app/auth/actions";

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<PwState, FormData>(
    updatePassword,
    {}
  );

  return (
    <form action={action} className="flex flex-col gap-3.5">
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-strong">
        New password
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-purple"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px] font-medium text-strong">
        Confirm password
        <input
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-purple"
        />
      </label>

      {state.error && (
        <p className="rounded-lg border border-red-line bg-red-soft px-3 py-2 text-[12.5px] text-red">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 rounded-lg bg-purple px-4 py-2.5 text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Set password & continue"}
      </button>
    </form>
  );
}
