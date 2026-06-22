"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Clients" },
  { href: "/admin/mailboxes", label: "Mailboxes" },
  { href: "/admin/settings", label: "Credentials" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 border-b border-line">
      {TABS.map((t) => {
        const active =
          t.href === "/admin"
            ? pathname === "/admin" || pathname.startsWith("/admin/clients")
            : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`-mb-px border-b-[2.5px] px-3.5 py-2.5 text-[13.5px] font-semibold ${
              active
                ? "border-purple text-purple"
                : "border-transparent text-muted hover:text-strong"
            }`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
