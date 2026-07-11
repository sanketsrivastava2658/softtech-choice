import { getActiveWorkspace } from "@/lib/workspace";
import { getInvoices } from "@/lib/data";
import { PageTitle } from "@/components/ui/PageTitle";
import { BillingView } from "@/components/dashboard/BillingView";

export default async function BillingPage() {
  const workspace = await getActiveWorkspace();
  const invoices = await getInvoices(workspace.id);

  return (
    <>
      <PageTitle title="Billing" />
      <BillingView invoices={invoices} />
    </>
  );
}
