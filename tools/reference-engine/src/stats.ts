export interface Band {
  day: number;
  low: number;
  median: number;
  high: number;
}

export interface Summary {
  low: number;
  median: number;
  high: number;
}

export function quantile(sorted: number[], q: number) {
  if (!sorted.length) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
}

/** 5th, 50th and 95th percentile across runs, for each day. */
export function bands(runs: number[][]): Band[] {
  const days = runs[0]?.length ?? 0;
  return Array.from({ length: days }, (_, d) => {
    const col = runs.map((r) => r[d]).sort((a, b) => a - b);
    return { day: d, low: quantile(col, 0.05), median: quantile(col, 0.5), high: quantile(col, 0.95) };
  });
}

export function summarize(values: number[]): Summary {
  const s = [...values].sort((a, b) => a - b);
  return { low: quantile(s, 0.05), median: quantile(s, 0.5), high: quantile(s, 0.95) };
}

export function share(count: number, total: number) {
  return total > 0 ? count / total : 0;
}