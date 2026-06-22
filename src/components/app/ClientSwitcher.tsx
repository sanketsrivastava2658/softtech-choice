"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Workspace } from "@/lib/types";
import { WS_COOKIE } from "@/lib/constants";
import { Icon } from "@/components/ui/Icon";

/**
 * Agency-admin client switcher. Sets the active-workspace cookie and refreshes
 * server components so every screen re-reads data for the chosen client.
 */
export function ClientSwitcher({
  workspaces,
  active,
}: {
  workspaces: Workspace[];
  active: Workspace;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function select(id: string) {
    document.cookie = `${WS_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-white/15"
      >
        <Icon name="building" size={15} className="text-white/70" />
        {active.name}
        <Icon name="chevronDown" size={14} className="text-white/70" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-surface py-1.5 shadow-lg shadow-black/10">
            <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-faint">
              Switch client
            </div>
            {workspaces.map((w) => (
              <button
                key={w.id}
                onClick={() => select(w.id)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-[13px] text-strong hover:bg-hover"
              >
                {w.name}
                {w.id === active.id && (
                  <Icon name="check" size={15} className="text-purple" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
