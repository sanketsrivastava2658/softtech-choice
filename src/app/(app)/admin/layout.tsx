import type { ReactNode } from "react";
import { requireSuperAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireSuperAdmin();
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-[20px] font-bold text-ink">Admin Console</h1>
        <p className="text-[13px] text-muted">
          Manage clients, sending infrastructure, and Smartlead credentials.
        </p>
      </div>
      <AdminNav />
      <div className="mt-5">{children}</div>
    </div>
  );
}
