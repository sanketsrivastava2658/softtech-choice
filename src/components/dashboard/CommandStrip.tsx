import type { Metric } from "@/lib/types";
import { Sparkline } from "@/components/ui/Sparkline";

function MetricTile({ metric }: { metric: Metric }) {
  return (
    <div className="bg-surface px-[14px] pt-[13px] pb-3">
      <div className="flex items-center gap-[6px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-faint">
        {metric.label}
      </div>
      <div
        className={`num mt-[9px] text-[26px] font-medium leading-none ${
          metric.hot ? "text-amber" : metric.positive ? "text-mint" : "text-text"
        }`}
      >
        {metric.value}
      </div>

      {metric.spark ? (
        <Sparkline
          points={metric.spark}
          color={metric.hot ? "var(--amber)" : "var(--muted)"}
        />
      ) : metric.delta ? (
        <div
          className={`mt-[7px] flex items-center gap-[5px] font-mono text-[11px] ${
            metric.deltaDir === "down" ? "text-red" : "text-mint"
          }`}
        >
          {metric.deltaDir === "down" ? "▼" : "▲"}{" "}
          <span className="num">{metric.delta}</span>
          <span className="text-faint">
            {metric.key === "booked" ? "this wk" : "vs prev"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The command strip — first thing in any dashboard view. Five key metrics as a
 * poster of live numbers, hairline-separated. Reply Rate (the money metric) is
 * the one emphasized in amber (DESIGN.md).
 */
export function CommandStrip({ metrics }: { metrics: Metric[] }) {
  return (
    <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-card border border-line bg-line min-[680px]:grid-cols-5">
      {metrics.map((m) => (
        <MetricTile key={m.key} metric={m} />
      ))}
    </div>
  );
}
