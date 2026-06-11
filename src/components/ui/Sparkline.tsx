/**
 * Tiny inline sparkline. Points are 0–1 normalized (0 = bottom, 1 = top),
 * plotted left→latest across a fixed 100×18 viewbox.
 */
export function Sparkline({
  points,
  color = "var(--muted)",
}: {
  points: number[];
  color?: string;
}) {
  if (points.length < 2) return null;
  const w = 100;
  const h = 18;
  const pad = 2;
  const step = w / (points.length - 1);
  const coords = points
    .map((p, i) => {
      const x = i * step;
      const y = pad + (1 - Math.max(0, Math.min(1, p))) * (h - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      className="mt-[9px] block h-[18px] w-full"
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden
    >
      <polyline
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords}
      />
    </svg>
  );
}
