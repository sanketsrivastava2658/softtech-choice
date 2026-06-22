import { AGENCY_NAME } from "@/lib/mock-data";
import { supabaseConfigured } from "@/lib/supabase/env";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const demo = !supabaseConfigured();

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-1 text-[22px] font-bold tracking-tight text-navy">
            {AGENCY_NAME}
          </div>
          <p className="text-[13px] text-muted">Sign in to your outbound console</p>
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
          <LoginForm next={next ?? "/analytics"} demo={demo} />
        </div>
        <p className="mt-4 text-center text-[12px] text-faint">
          Protected by Supabase Auth · agency &amp; client access
        </p>
      </div>
    </div>
  );
}
