"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";
import { Icon } from "@/components/ui/Icon";

export function Sidebar({ superAdmin = false }: { superAdmin?: boolean }) {
  const pathname = usePathname();
  const renderItem = (item: { href: string; label: string; icon: typeof NAV[number]["icon"] }) => {
    const active = pathname === item.href || pathname.startsWith(item.href + "/");
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
          active ? "bg-purple-soft text-purple" : "text-strong hover:bg-hover"
        }`}
      >
        <Icon name={item.icon} size={18} className={active ? "text-purple" : "text-faint"} />
        {item.label}
      </Link>
    );
  };

  return (
    <nav className="flex flex-col gap-0.5 p-2.5">
      {NAV.map(renderItem)}
      {superAdmin && (
        <>
          <div className="mx-3 my-2 border-t border-line" />
          <div className="px-3 pb-1 text-[10.5px] font-semibold uppercase tracking-wide text-faint">
            Administration
          </div>
          {renderItem({ href: "/admin", label: "Admin Console", icon: "building" })}
        </>
      )}
    </nav>
  );
}
