/** Thousands-separated integer, e.g. 14920 -> "14,920". */
export function fmtInt(n: number): string {
  return n.toLocaleString("en-US");
}

/** One-decimal percent, e.g. 8.4 -> "8.4%". */
export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}
