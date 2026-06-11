import type { Workspace } from "@/lib/types";

interface NavItem {
  label: string;
  glyph: string;
  count?: string;
  active?: boolean;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

// Presentational nav for the client surface. Routing gets wired in a later pass;
// glyphs stand in for an icon set so swapping to lucide-react is a localized change.
const CLIENT_NAV: NavSection[] = [
  {
    label: "Outbound",
    items: [
      { label: "Overview", glyph: "▦", active: true },
      { label: "Campaigns", glyph: "◷", count: "7" },
      { label: "Leads", glyph: "◌", count: "12.4k" },
      { label: "Inbox", glyph: "✉", count: "23" },
    ],
  },
  {
    label: "Insight",
    items: [
      { label: "Deliverability", glyph: "◈" },
      { label: "Reports", glyph: "▤" },
      { label: "Meetings", glyph: "◆", count: "9" },
    ],
  },
];

/** Left navigation rail (188px). Shows the active workspace + grouped nav. */
export function Rail({ workspace }: { workspace: Workspace }) {
  return (
    <aside className="border-r border-line bg-bg px-3 py-4">
      <div className="mb-[18px] flex items-center gap-[9px] px-2 py-[6px]">
        <span className="grid h-[26px] w-[26px] place-items-center rounded-chip border border-line bg-elevated font-mono text-[11px] text-amber">
          {workspace.initials}
        </span>
        <div>
          <div className="text-[12.5px] font-medium">{workspace.name}</div>
          <span className="block font-mono text-[11px] text-faint">
            {workspace.kind} · workspace
          </span>
        </div>
      </div>

      {CLIENT_NAV.map((section) => (
        <nav key={section.label}>
          <div className="mt-[14px] mb-[6px] px-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
            {section.label}
          </div>
          {section.items.map((item) => (
            <a
              key={item.label}
              className={`mb-px flex cursor-pointer items-center gap-[9px] rounded-input px-2 py-[7px] text-[13px] no-underline transition-colors ${
                item.active
                  ? "bg-amber-dim text-text"
                  : "text-muted hover:bg-hover hover:text-text"
              }`}
            >
              <span
                className={`text-[13px] ${item.active ? "text-amber" : "opacity-80"}`}
                aria-hidden
              >
                {item.glyph}
              </span>
              {item.label}
              {item.count && (
                <span className="ml-auto font-mono text-[11px] text-faint">
                  {item.count}
                </span>
              )}
            </a>
          ))}
        </nav>
      ))}
    </aside>
  );
}
