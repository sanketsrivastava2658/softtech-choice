import type { ReactNode } from "react";
import { listWorkspaces } from "@/lib/data";
import { getActiveWorkspace } from "@/lib/workspace";
import { isSuperAdmin } from "@/lib/auth";
import { Topbar } from "./Topbar";
import { Sidebar } from "./Sidebar";

/**
 * Application chrome: navy top bar over a two-column body — light left nav rail
 * (190px) and a fluid main column on a faint canvas. Below 860px the rail
 * collapses and main goes full width.
 */
export async function AppShell({ children }: { children: ReactNode }) {
  const [workspaces, active, superAdmin] = await Promise.all([
    listWorkspaces(),
    getActiveWorkspace(),
    isSuperAdmin(),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <Topbar workspaces={workspaces} active={active} />
      <div className="flex flex-1">
        <aside className="w-[190px] flex-none border-r border-line bg-surface max-[860px]:hidden">
          <Sidebar superAdmin={superAdmin} />
        </aside>
        <main className="min-w-0 flex-1 px-6 py-5 max-[640px]:px-4">
          {children}
        </main>
      </div>
    </div>
  );
}
