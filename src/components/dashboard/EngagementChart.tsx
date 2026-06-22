"use client";

import { useState } from "react";
import type { EngagementPoint } from "@/lib/types";
import { fmtDateLabel, fmtInt } from "@/lib/format";

const SERIES = [
  { key: "sent", label: "Sent", color: "#6366f1" },
  { key: "opened", label: "Opened", color: "#0d9488" },
  { key: "replied", label: "Replied", color: "#16a34a" },
] as const;

const W = 1000;
const H = 280;
const PAD = { top: 16, right: 16, bottom: 28, left: 40 };

export function EngagementChart({ data }: { data: EngagementPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);

  const empty = data.length === 0;
  const max = Math.max(1, ...data.map((d) => d.sent));
  const niceMax = niceCeil(max);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) =>
    PAD.left + (data.length <= 1 ? 0 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;

  const ticks = 5;
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) =>
    Math.round((niceMax / ticks) * i)
  );

  const path = (key: (typeof SERIES)[number]["key"]) =>
    data
      .map((d, i) => `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d[key]).toFixed(1)}`)
      .join(" ");

  const xLabelEvery = Math.max(1, Math.ceil(data.length / 8));

  return (
    <div>
      <div className="mb-3 flex items-center gap-5 px-1">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[12px] text-muted">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: s.color }}
            />
            {s.label}
          </span>
        ))}
      </div>

      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: H }}
          onMouseLeave={() => setHover(null)}
        >
          {/* gridlines + y labels */}
          {yTicks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="#eef0f3"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                fontSize={11}
                fill="#9ca3af"
              >
                {t}
              </text>
            </g>
          ))}

          {/* x labels */}
          {data.map((d, i) =>
            i % xLabelEvery === 0 ? (
              <text
                key={d.date}
                x={x(i)}
                y={H - 8}
                textAnchor="middle"
                fontSize={11}
                fill="#9ca3af"
              >
                {fmtDateLabel(d.date)}
              </text>
            ) : null
          )}

          {/* series lines */}
          {!empty &&
            SERIES.map((s) => (
              <path
                key={s.key}
                d={path(s.key)}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

          {/* hover crosshair + dots + hit areas */}
          {!empty && hover !== null && (
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              stroke="#cbd0d8"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}
          {!empty &&
            hover !== null &&
            SERIES.map((s) => (
              <circle
                key={s.key}
                cx={x(hover)}
                cy={y(data[hover][s.key])}
                r={3.5}
                fill="#fff"
                stroke={s.color}
                strokeWidth={2}
              />
            ))}
          {!empty &&
            data.map((d, i) => (
              <rect
                key={d.date}
                x={x(i) - innerW / (data.length * 2)}
                y={PAD.top}
                width={innerW / data.length}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setHover(i)}
              />
            ))}

          {empty && (
            <text
              x={W / 2}
              y={H / 2}
              textAnchor="middle"
              fontSize={13}
              fill="#9ca3af"
            >
              No engagement data for this range
            </text>
          )}
        </svg>

        {/* tooltip */}
        {!empty && hover !== null && (
          <div
            className="pointer-events-none absolute top-2 rounded-lg border border-line bg-surface px-3 py-2 text-[12px] shadow-md"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="mb-1 font-semibold text-ink">
              {fmtDateLabel(data[hover].date)}
            </div>
            {SERIES.map((s) => (
              <div key={s.key} className="flex items-center gap-2 text-muted">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: s.color }}
                />
                {s.label}
                <span className="num ml-auto font-semibold text-ink">
                  {fmtInt(data[hover][s.key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function niceCeil(n: number): number {
  if (n <= 5) return 5;
  const mag = Math.pow(10, Math.floor(Math.log10(n)));
  const norm = n / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}
