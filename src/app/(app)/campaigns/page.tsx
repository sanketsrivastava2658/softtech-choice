import Link from "next/link";
import { getActiveWorkspace } from "@/lib/workspace";
import { getCampaigns } from "@/lib/data";
import { PageTitle } from "@/components/ui/PageTitle";
import { CampaignsTable } from "@/components/dashboard/CampaignsTable";

export default async function CampaignsPage() {
  const workspace = await getActiveWorkspace();
  const campaigns = await getCampaigns(workspace.id);

  return (
    <>
      <PageTitle
        title="Email Campaigns"
        right={
          <Link
            href="/campaigns/new"
            className="rounded-lg bg-purple px-4 py-2 text-[13px] font-semibold text-white hover:opacity-90"
          >
            + New campaign
          </Link>
        }
      />
      <CampaignsTable campaigns={campaigns} />
    </>
  );
}
