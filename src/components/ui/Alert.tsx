import type { AlertLevel } from "@/lib/types";

const ICON: Record<AlertLevel, string> = { ok: "✓", warn: "!", err: "✕" };
const BORDER: Record<AlertLevel, string> = {
  ok: "border-mint-line",
  warn: "border-orange-line",
  err: "border-red-line",
};
const ICON_COLOR: Record<AlertLevel, string> = {
  ok: "text-mint",
  warn: "text-orange",
  err: "text-red",
};

/** Deliverability signal row. Semantic border + mono glyph, no filled background. */
export function Alert({
  level,
  children,
}: {
  level: AlertLevel;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start gap-[10px] rounded-card border bg-surface px-[13px] py-[11px] text-[12.5px] ${BORDER[level]}`}
    >
      <span
        className={`mt-[1px] shrink-0 font-mono text-[13px] font-semibold ${ICON_COLOR[level]}`}
        aria-hidden
      >
        {ICON[level]}
      </span>
      <div className="text-text">{children}</div>
    </div>
  );
}
