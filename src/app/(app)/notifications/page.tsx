import { getActiveWorkspace } from "@/lib/workspace";
import { getNotifications } from "@/lib/data";
import { PageTitle } from "@/components/ui/PageTitle";
import { NotificationsView } from "@/components/dashboard/NotificationsView";

export default async function NotificationsPage() {
  const workspace = await getActiveWorkspace();
  const notifications = await getNotifications(workspace.id);

  return (
    <>
      <PageTitle title="Notifications" />
      <NotificationsView notifications={notifications} workspaceId={workspace.id} />
    </>
  );
}
