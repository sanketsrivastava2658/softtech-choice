"use client";

import { useState } from "react";
import { signOut } from "@/app/login/actions";
import { Icon } from "@/components/ui/Icon";

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string;
  email: string;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = (name || email || "A").charAt(0).toUpperCase();
  const roleLabel =
    role === "super_admin"
      ? "Super admin"
      : role === "agency_admin"
      ? "Agency admin"
      : "Client";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5"
        aria-label="Account"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full border-2 border-white/30 bg-gradient-to-br from-indigo-300 to-indigo-500 text-[12px] font-semibold text-white">
          {initial}
        </span>
        <Icon name="chevronDown" size={16} className="text-white/80" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-lg shadow-black/10">
            <div className="px-3 py-2">
              <div className="truncate text-[13.5px] font-semibold text-ink">
                {name || "Demo user"}
              </div>
              <div className="num truncate text-[12px] text-muted">{email || "demo mode"}</div>
              <span className="mt-1.5 inline-block rounded-full bg-purple-soft px-2 py-0.5 text-[11px] font-semibold text-purple">
                {roleLabel}
              </span>
            </div>
            <div className="my-1 border-t border-line" />
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] text-strong hover:bg-hover"
              >
                <Icon name="logout" size={15} className="text-faint" />
                Sign out
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
