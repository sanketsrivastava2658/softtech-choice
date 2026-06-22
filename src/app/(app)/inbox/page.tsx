import { getActiveWorkspace } from "@/lib/workspace";
import { getInbox } from "@/lib/data";
import { PageTitle } from "@/components/ui/PageTitle";
import { InboxView } from "@/components/dashboard/InboxView";

export default async function InboxPage() {
  const workspace = await getActiveWorkspace();
  const messages = await getInbox(workspace.id);

  return (
    <>
      <PageTitle title="Master Inbox" />
      <InboxView messages={messages} />
    </>
  );
}
