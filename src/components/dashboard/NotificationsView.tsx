import type { AppNotification, NotificationLevel } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { Icon, type IconName } from "@/components/ui/Icon";
import { markNotificationRead, markAllNotificationsRead } from "@/app/(app)/actions";

const LEVEL: Record<NotificationLevel, { icon: IconName; className: string }> = {
  info: { icon: "info", className: "text-blue" },
  success: { icon: "check", className: "text-green" },
  warning: { icon: "alert", className: "text-amber" },
  critical: { icon: "alert", className: "text-red" },
};

export function NotificationsView({
  notifications,
  workspaceId,
}: {
  notifications: AppNotification[];
  workspaceId: string;
}) {
  const now = new Date();
  const unread = notifications.filter((n) => !n.readAt).length;

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-card border border-dashed border-line bg-surface px-6 py-16 text-center">
        <Icon name="bell" size={24} className="text-faint" />
        <p className="text-[14px] font-semibold text-ink">You&apos;re all caught up</p>
        <p className="max-w-sm text-[12.5px] text-muted">
          Account activity and notices from your agency will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <h3 className="text-[13px] font-bold text-ink">
          Notifications{" "}
          {unread > 0 && <span className="num text-purple">· {unread} unread</span>}
        </h3>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <input type="hidden" name="workspace_id" value={workspaceId} />
            <button
              type="submit"
              className="text-[12px] font-semibold text-purple hover:underline"
            >
              Mark all read
            </button>
          </form>
        )}
      </div>

      <ul>
        {notifications.map((n) => {
          const meta = LEVEL[n.level];
          return (
            <li
              key={n.id}
              className={`flex items-start gap-3 border-b border-line px-5 py-3.5 last:border-b-0 ${
                n.readAt ? "" : "bg-purple-soft/40"
              }`}
            >
              <Icon name={meta.icon} size={17} className={`mt-0.5 flex-none ${meta.className}`} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {!n.readAt && (
                    <span className="h-1.5 w-1.5 flex-none rounded-full bg-purple" />
                  )}
                  <span className="text-[13px] font-semibold text-ink">{n.title}</span>
                </div>
                {n.body && <p className="mt-0.5 text-[12.5px] text-muted">{n.body}</p>}
                <span className="num mt-1 block text-[11.5px] text-faint">
                  {timeAgo(n.createdAt, now)}
                </span>
              </div>
              {!n.readAt && (
                <form action={markNotificationRead} className="flex-none">
                  <input type="hidden" name="notification_id" value={n.id} />
                  <button
                    type="submit"
                    aria-label="Mark read"
                    className="rounded-md px-2 py-1 text-[11.5px] font-medium text-muted hover:bg-hover hover:text-purple"
                  >
                    Mark read
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
