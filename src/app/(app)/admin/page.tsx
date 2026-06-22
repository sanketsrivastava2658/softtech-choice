import Link from "next/link";
import { listWorkspaces } from "@/lib/data";
import { masterConfigured } from "@/lib/credentials";
import { supabaseConfigured } from "@/lib/supabase/env";
import { OnboardClientForm } from "@/components/admin/OnboardClientForm";
import { Icon } from "@/components/ui/Icon";

export default async function AdminClientsPage() {
  const [clients, masterOk] = await Promise.all([listWorkspaces(), masterConfigured()]);
  const supaOk = supabaseConfigured();

  return (
    <div className="flex flex-col gap-5">
      {(!supaOk || !masterOk) && (
        <div className="flex items-start gap-2 rounded-card border border-line bg-canvas px-4 py-3 text-[12.5px] text-muted">
          <Icon name="info" size={15} className="mt-0.5 flex-none text-faint" />
          <span>
            {!supaOk && <>Supabase isn&apos;t configured — showing demo clients. </>}
            {!masterOk && <>No master Smartlead key set — add it under <b>Credentials</b>. </>}
            Onboarding writes real data once both are configured.
          </span>
        </div>
      )}

      <OnboardClientForm />

      <div className="overflow-hidden rounded-card border border-line bg-surface">
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h3 className="text-[14px] font-bold text-ink">Clients</h3>
          <span className="num text-[12.5px] text-faint">{clients.length} total</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="text-faint">
                <Th first>Client</Th>
                <Th>Status</Th>
                <Th>Domain</Th>
                <Th>Smartlead client</Th>
                <Th>Data</Th>
                <Th>{""}</Th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {clients.map((c) => {
                const live = Boolean(c.smartleadApiKey);
                return (
                  <tr key={c.id} className="hover:bg-hover">
                    <Td first>
                      <div className="font-semibold text-ink">{c.name}</div>
                      <div className="text-[12px] text-faint">{c.slug}</div>
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold ${
                          c.status === "active"
                            ? "border-green-line bg-green-soft text-green"
                            : "border-line bg-canvas text-muted"
                        }`}
                      >
                        {c.status ?? "active"}
                      </span>
                    </Td>
                    <Td className="text-strong">{c.primaryDomain ?? "—"}</Td>
                    <Td className="num text-strong">
                      {c.smartleadClientId ? `#${c.smartleadClientId}` : "—"}
                    </Td>
                    <Td>
                      <span
                        className={`inline-flex items-center gap-1.5 text-[12px] font-medium ${
                          live ? "text-green" : "text-muted"
                        }`}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: live ? "var(--green)" : "var(--faint)" }}
                        />
                        {live ? "Live" : "Demo"}
                      </span>
                    </Td>
                    <Td>
                      <Link
                        href={`/admin/clients/${c.id}`}
                        className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-purple hover:underline"
                      >
                        Manage <Icon name="chevronDown" size={13} className="-rotate-90" />
                      </Link>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Th({ children, first }: { children: React.ReactNode; first?: boolean }) {
  return (
    <th
      className={`border-b border-line px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide ${
        first ? "text-left" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}
function Td({
  children,
  first,
  className = "",
}: {
  children: React.ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <td className={`border-b border-line px-5 py-3 align-middle text-left ${className}`}>
      {children}
    </td>
  );
}
