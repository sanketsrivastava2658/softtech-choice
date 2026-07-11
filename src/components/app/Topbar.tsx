import Link from "next/link";
import type { Workspace } from "@/lib/types";
import { getProfile, getEffectiveRole } from "@/lib/auth";
import { getNotifications } from "@/lib/data";
import { Icon } from "@/components/ui/Icon";
import { ClientSwitcher } from "./ClientSwitcher";
import { UserMenu } from "./UserMenu";

/** Company brand lockup — logo (or a colored monogram) + display name. */
function BrandMark({ ws }: { ws: Workspace }) {
  const color = ws.brandColor || "#ffffff";
  const name = ws.displayName || ws.name;
  return (
    <div className="flex items-center gap-2.5">
      {ws.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ws.logoUrl}
          alt={name}
          className="h-7 w-7 flex-none rounded-md object-cover"
        />
      ) : (
        <span
          className="grid h-7 w-7 flex-none place-items-center rounded-md text-[13px] font-bold text-white"
          style={{ backgroundColor: ws.brandColor || "rgba(255,255,255,0.15)" }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span
        className="text-[18px] font-bold tracking-tight"
        style={ws.brandColor ? { color } : undefined}
      >
        {name}
      </span>
    </div>
  );
}

export async function Topbar({
  workspaces,
  active,
}: {
  workspaces: Workspace[];
  active: Workspace;
}) {
  const [profile, role, notifications] = await Promise.all([
    getProfile(),
    getEffectiveRole(),
    getNotifications(active.id),
  ]);
  // super_admin / agency_admin can switch between clients; client_user cannot
  const isAdmin = role === "super_admin" || role === "agency_admin";
  const unread = notifications.filter((n) => !n.readAt).length;

  return (
    <header
      className="sticky top-0 z-30 flex h-[52px] items-center gap-4 bg-navy px-5 text-white"
      style={active.brandColor ? { boxShadow: `inset 0 -3px 0 0 ${active.brandColor}` } : undefined}
    >
      <button className="flex flex-col gap-1 p-1" aria-label="Menu">
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
        <span className="block h-0.5 w-5 rounded bg-white" />
      </button>

      <BrandMark ws={active} />

      <div className="ml-auto flex items-center gap-3">
        {isAdmin ? (
          <ClientSwitcher workspaces={workspaces} active={active} />
        ) : (
          <span className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[13px] font-medium text-white">
            {active.name}
          </span>
        )}

        <Link
          href="/notifications"
          aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
          className="relative grid h-9 w-9 place-items-center rounded-lg text-white/90 hover:bg-white/10"
        >
          <Icon name="bell" size={18} />
          {unread > 0 && (
            <span className="num absolute -right-0.5 -top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-red px-1 text-[10px] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </Link>

        <UserMenu
          name={profile?.fullName ?? ""}
          email={profile?.email ?? ""}
          role={role}
        />
      </div>
    </header>
  );
}
