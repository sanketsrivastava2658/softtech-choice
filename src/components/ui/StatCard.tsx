import { Icon, type IconName } from "./Icon";

export type StatTone = "purple" | "teal" | "green" | "red";

const TONE: Record<StatTone, string> = {
  purple: "bg-purple-soft border-purple-line text-purple",
  teal: "bg-teal-soft border-teal-line text-teal",
  green: "bg-green-soft border-green-line text-green",
  red: "bg-red-soft border-red-line text-red",
};

/** The colored headline metric tile from the Performance Metrics row. */
export function StatCard({
  tone,
  icon,
  label,
  value,
  subValue,
  subLabel,
}: {
  tone: StatTone;
  icon: IconName;
  label: string;
  value: string;
  subValue: string;
  subLabel: string;
}) {
  const accent = TONE[tone].split(" ").find((c) => c.startsWith("text-"))!;
  return (
    <div className={`rounded-card border p-4 ${TONE[tone]}`}>
      <div className="flex items-center gap-2">
        <span className={accent}>
          <Icon name={icon} size={18} />
        </span>
        <span className="text-[13.5px] font-semibold text-strong">{label}</span>
        <span className="text-ghost">
          <Icon name="info" size={14} />
        </span>
      </div>
      <div className={`num mt-3.5 text-[34px] font-bold leading-none ${accent}`}>
        {value}
      </div>
      <div className="mt-3.5 text-[12.5px] text-muted">
        <span className="num font-semibold text-strong">{subValue}</span>{" "}
        {subLabel}
      </div>
    </div>
  );
}
