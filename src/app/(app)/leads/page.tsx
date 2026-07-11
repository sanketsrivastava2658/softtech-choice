import { getActiveWorkspace } from "@/lib/workspace";
import { getLeads } from "@/lib/data";
import { getMembershipRole, canManage } from "@/lib/access";
import { PageTitle } from "@/components/ui/PageTitle";
import { LeadsView } from "@/components/dashboard/LeadsView";

export default async function LeadsPage() {
  const workspace = await getActiveWorkspace();
  const [leads, role] = await Promise.all([
    getLeads(workspace.id),
    getMembershipRole(workspace.id),
  ]);

  return (
    <>
      <PageTitle title="Leads" />
      <LeadsView leads={leads} canManage={canManage(role)} />
    </>
  );
}
