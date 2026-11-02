import { DistrictResult, GeoMetric, GeoResults } from '../types/geographic';

// Colour scales for the district map. Both are fixed for the whole run so days can be compared.

/** Cases: single sequential emerald scale on a log axis from 1 to the run-wide maximum. */
export const SCALE = ['#D1FAE5', '#A7F3D0', '#6EE7B7', '#34D399', '#059669', '#065F46'];
export const NO_CASES = '#F8FAFC';
/** Beds vs capacity (docs Module 9): green below 70%, amber 70–100%, red above 100%. */
export const BED_COLORS = { within: '#A7F3D0', tight: '#FCD34D', over: '#F87171' };
export const AMBER_FROM = 0.7;

export const fmt = (n: number | null | undefined) => n === null || n === undefined ? '—' : Math.round(n).toLocaleString();

export function casesAt(d: DistrictResult, day: number) {
  const m = d.series.cumulative.median;
  return m[Math.min(day, m.length - 1)] ?? 0;
}

export function bedsAt(d: DistrictResult, day: number) {
  const m = d.series.hospitalised.median;
  return m[Math.min(day, m.length - 1)] ?? 0;
}

/** Fill colour for one district on one day. */
export function fillFor(d: DistrictResult, metric: GeoMetric, day: number, maxCases: number) {
  if (metric === 'cases') {
    const cum = casesAt(d, day);
    if (cum < 1) return NO_CASES;
    const norm = maxCases > 1 ? Math.log10(cum) / Math.log10(maxCases) : 1;
    return SCALE[Math.min(SCALE.length - 1, Math.max(0, Math.floor(norm * SCALE.length)))];
  }
  const need = bedsAt(d, day);
  if (need < 0.5 || !d.beds) return NO_CASES;
  const ratio = need / d.beds;
  return ratio > 1 ? BED_COLORS.over : ratio >= AMBER_FROM ? BED_COLORS.tight : BED_COLORS.within;
}

export function valueLabel(d: DistrictResult, metric: GeoMetric, day: number) {
  if (metric === 'cases') return `${fmt(casesAt(d, day))} cases (median)`;
  if (!d.beds) return 'No bed figure for this district';
  return `${Math.round(bedsAt(d, day) / d.beds * 100)}% of ${fmt(d.beds)} beds (median)`;
}

/** Reached in some runs but not at the median: shown with a dashed outline, never as invented cases. */
export function reachedOnlyInSomeRuns(d: DistrictResult) {
  return (d.pReached ?? 0) >= 0.05 && (d.totalCases.median ?? 0) < 1;
}

export function legendFor(metric: GeoMetric, g: GeoResults | undefined) {
  return metric === 'cases' ?
  { title: 'Projected cases (median, cumulative)', low: '1', high: fmt(Math.max(1, g?.scale.maxCumulativeCases ?? 1)) } :
  { title: 'Bed demand vs capacity', low: '<70%', high: '>100%' };
}

export const pctText = (p: number | null | undefined) => p === null || p === undefined ? '—' : `${Math.round(p * 100)}%`;
