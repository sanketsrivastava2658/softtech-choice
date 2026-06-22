import { AGENCY_NAME } from "@/lib/mock-data";
import type { Workspace } from "@/lib/types";
import { getProfile, getEffectiveRole } from "@/lib/auth";
import { ClientSwitcher } from "./ClientSwitcher";
import { UserMenu } from "./UserMenu";

export async function Topbar({
  workspaces,
  active,
}: {
  workspaces: Workspace[];
  active: Workspace;
}) {
  const [profile, role] = await Promise.all([getProfile(), getEffectiveRole()]);
  // super_admin / agency_admin can switch between clients; client_user cannot
  const isAdmin = role === "super_admin" || role === "agency_admin";

  return (
    <header className="sticky top-0 z-30 flex h-[52px] items-center gap-4 bg-navy px-5 text-white">
      <button className="flex flex-col gap-1 p-1" aria-label="Menu">
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
      </button>

      <div className="text-[19px] font-bold tracking-tight">{AGENCY_NAME}</div>

      <div className="ml-auto flex items-center gap-3">
        {isAdmin ? (
          <ClientSwitcher workspaces={workspaces} active={active} />
        ) : (
          <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white">
            {active.name}
          </span>
        )}
        <UserMenu
          name={profile?.fullName ?? ""}
          email={profile?.email ?? ""}
          role={role}
        />
      </div>
    </header>
  );
}
