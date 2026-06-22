import { getMasterCreds } from "@/lib/credentials";
import { supabaseConfigured } from "@/lib/supabase/env";
import { DEFAULT_BASE_URL } from "@/lib/smartlead";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Icon } from "@/components/ui/Icon";

function mask(key: string): string {
  if (key.length <= 8) return "••••";
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export default async function AdminSettingsPage() {
  const creds = await getMasterCreds();
  const supaOk = supabaseConfigured();

  return (
    <div className="flex max-w-2xl flex-col gap-5">
      <SettingsForm
        configured={Boolean(creds)}
        maskedKey={creds ? mask(creds.masterKey) : ""}
        baseUrl={creds?.baseUrl ?? DEFAULT_BASE_URL}
      />

      {!supaOk && (
        <div className="flex items-start gap-2 rounded-card border border-line bg-canvas px-4 py-3 text-[12.5px] text-muted">
          <Icon name="info" size={15} className="mt-0.5 flex-none text-faint" />
          <span>
            Supabase isn&apos;t configured, so the key can&apos;t be stored in the
            database. Either add Supabase keys, or set{" "}
            <code className="num rounded bg-surface px-1">SMARTLEAD_API_KEY</code> in{" "}
            <code className="num rounded bg-surface px-1">.env.local</code>.
          </span>
        </div>
      )}
    </div>
  );
}
