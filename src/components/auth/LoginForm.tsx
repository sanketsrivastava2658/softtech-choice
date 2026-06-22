"use client";

import { useActionState } from "react";
import { signIn, type LoginState } from "@/app/login/actions";

export function LoginForm({
  next,
  demo,
}: {
  next: string;
  demo: boolean;
}) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    signIn,
    {}
  );

  return (
    <form action={formAction} className="flex flex-col gap-3.5">
      <input type="hidden" name="next" value={next} />

      {demo ? (
        <p className="rounded-lg border border-line bg-canvas px-3 py-2.5 text-[12.5px] text-muted">
          Demo mode — authentication is disabled until Supabase keys are added.
          Continue to explore the app.
        </p>
      ) : (
        <>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-strong">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-purple"
              placeholder="you@agency.com"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-[13px] font-medium text-strong">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="rounded-lg border border-line px-3 py-2.5 text-[14px] outline-none focus:border-purple"
              placeholder="••••••••"
            />
          </label>
        </>
      )}

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
        {pending ? "Signing in…" : demo ? "Enter app" : "Sign in"}
      </button>
    </form>
  );
}
