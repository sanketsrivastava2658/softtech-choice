import Link from "next/link";
import { AGENCY_NAME } from "@/lib/mock-data";
import { getCurrentUser } from "@/lib/auth";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default async function SetPasswordPage() {
  const user = await getCurrentUser();

  return (
    <div className="grid min-h-screen place-items-center bg-canvas px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-1 text-[22px] font-bold tracking-tight text-navy">
            {AGENCY_NAME}
          </div>
          <p className="text-[13px] text-muted">
            {user ? "Set your password to finish signing in" : "Activate your account"}
          </p>
        </div>
        <div className="rounded-card border border-line bg-surface p-6 shadow-sm">
          {user ? (
            <SetPasswordForm />
          ) : (
            <div className="text-center text-[13px] text-muted">
              <p className="mb-3">
                This link is invalid or has expired. Ask your admin to send a fresh
                access link.
              </p>
              <Link href="/login" className="font-semibold text-purple hover:underline">
                Go to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
