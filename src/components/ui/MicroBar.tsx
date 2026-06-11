/** Inline amber micro-bar showing a 0–100 rate next to a table figure. */
export function MicroBar({ pct }: { pct: number }) {
  const w = Math.max(0, Math.min(100, pct));
  return (
    <span className="ml-2 inline-block h-[5px] w-[54px] overflow-hidden rounded-[3px] bg-elevated align-middle">
      <span className="block h-full bg-amber" style={{ width: `${w}%` }} />
    </span>
  );
}
