"use client";

import { useMemo, useState } from "react";
import type { InboxMessage, ReplyCategory } from "@/lib/types";
import { initials } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import { CategoryBadge } from "@/components/ui/Badge";

const CATEGORY_FILTERS: { label: string; value: ReplyCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Interested", value: "interested" },
  { label: "Meetings", value: "meeting_request" },
  { label: "Not interested", value: "not_interested" },
  { label: "OOO", value: "out_of_office" },
];

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))}m`;
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export function InboxView({ messages }: { messages: InboxMessage[] }) {
  const [cat, setCat] = useState<ReplyCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(messages[0]?.id ?? null);

  const filtered = useMemo(() => {
    return messages.filter((m) => {
      if (cat !== "all" && m.category !== cat) return false;
      if (query) {
        const q = query.toLowerCase();
        return (
          m.leadName.toLowerCase().includes(q) ||
          m.leadEmail.toLowerCase().includes(q) ||
          m.subject.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [messages, cat, query]);

  const selected =
    filtered.find((m) => m.id === selectedId) ?? filtered[0] ?? null;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface">
      {/* filter bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        {CATEGORY_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setCat(f.value)}
            className={`rounded-full border px-3 py-1 text-[12.5px] font-medium ${
              cat === f.value
                ? "border-purple-line bg-purple-soft text-purple"
                : "border-line text-muted hover:bg-hover"
            }`}
          >
            {f.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 rounded-lg border border-line px-2.5 py-1.5">
          <Icon name="search" size={14} className="text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search replies"
            className="w-40 bg-transparent text-[13px] outline-none placeholder:text-faint"
          />
        </div>
      </div>

      <div className="grid grid-cols-[340px_minmax(0,1fr)] max-[820px]:grid-cols-1">
        {/* thread list */}
        <div className="max-h-[620px] overflow-y-auto border-r border-line max-[820px]:max-h-80">
          {filtered.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedId(m.id)}
              className={`flex w-full gap-3 border-b border-line px-4 py-3 text-left hover:bg-hover ${
                selected?.id === m.id ? "bg-purple-soft/60" : ""
              }`}
            >
              <span className="mt-0.5 grid h-8 w-8 flex-none place-items-center rounded-full bg-canvas text-[11px] font-semibold text-strong">
                {initials(m.leadName)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <b
                    className={`truncate text-[13px] ${
                      m.read ? "font-medium text-strong" : "font-bold text-ink"
                    }`}
                  >
                    {m.leadName}
                  </b>
                  <span className="num ml-auto flex-none text-[11px] text-faint">
                    {relTime(m.receivedAt)}
                  </span>
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-muted">
                  {m.snippet}
                </span>
                <span className="mt-1.5 block">
                  <CategoryBadge category={m.category} />
                </span>
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-4 py-10 text-center text-[13px] text-muted">
              No replies match.
            </div>
          )}
        </div>

        {/* message detail */}
        {selected ? (
          <div className="p-6 max-[820px]:border-t max-[820px]:border-line">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 flex-none place-items-center rounded-full bg-canvas text-[14px] font-semibold text-strong">
                {initials(selected.leadName)}
              </span>
              <div className="min-w-0">
                <div className="text-[16px] font-bold text-ink">
                  {selected.leadName}
                </div>
                <div className="num text-[12.5px] text-muted">
                  {selected.leadEmail}
                </div>
              </div>
              <div className="ml-auto">
                <CategoryBadge category={selected.category} />
              </div>
            </div>

            <div className="mt-5 text-[12px] text-faint">
              Campaign:{" "}
              <span className="font-medium text-strong">
                {selected.campaignName || "—"}
              </span>
            </div>
            <h3 className="mt-1 text-[15px] font-semibold text-ink">
              {selected.subject}
            </h3>
            <p className="mt-3 whitespace-pre-line text-[14px] leading-relaxed text-strong">
              {selected.body}
            </p>

            <div className="mt-6 flex gap-2">
              <button className="flex items-center gap-1.5 rounded-lg bg-purple px-3.5 py-2 text-[13px] font-semibold text-white hover:opacity-90">
                <Icon name="reply" size={15} /> Reply
              </button>
              <button className="rounded-lg border border-line px-3.5 py-2 text-[13px] font-medium text-strong hover:bg-hover">
                Mark as lead
              </button>
            </div>
          </div>
        ) : (
          <div className="grid place-items-center p-10 text-[13px] text-muted">
            Select a reply to read it.
          </div>
        )}
      </div>
    </div>
  );
}
