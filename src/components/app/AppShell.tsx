import type { ReactNode } from "react";
import type { Workspace } from "@/lib/types";
import { Topbar } from "./Topbar";
import { Rail } from "./Rail";

/**
 * Application chrome: global top bar over a 3-column grid —
 * left nav rail (188px) · fluid main · optional right context panel (264px).
 * Below 920px the rails collapse to a single column and main stacks (DESIGN.md).
 */
export function AppShell({
  workspace,
  rightPanel,
  children,
}: {
  workspace: Workspace;
  rightPanel?: ReactNode;
  children: ReactNode;
}) {
  const cols = rightPanel
    ? "min-[920px]:grid-cols-[188px_minmax(0,1fr)_264px]"
    : "min-[920px]:grid-cols-[188px_minmax(0,1fr)]";

  return (
    <div className="flex min-h-screen flex-col">
      <Topbar />
      <div className={`grid flex-1 grid-cols-1 ${cols}`}>
        <div className="max-[920px]:hidden">
          <Rail workspace={workspace} />
        </div>
        <main className="min-w-0 px-5 pt-[18px] pb-[22px]">{children}</main>
        {rightPanel && (
          <aside className="border-l border-line bg-bg px-[14px] py-4 max-[920px]:hidden">
            {rightPanel}
          </aside>
        )}
      </div>
    </div>
  );
}
