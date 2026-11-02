import { DashboardContext } from './types';

// Forecast Horizon is a global forward-looking analytical context variable.
// All forecast-related components derive their horizon from here.

export const HORIZON_OPTIONS = [
{ value: '7d', label: 'Next 7 Days' },
{ value: '30d', label: 'Next 30 Days' },
{ value: '90d', label: 'Next 90 Days' },
{ value: '180d', label: 'Next 180 Days' },
{ value: '365d', label: 'Next 365 Days' }];


export function horizonDays(timeRange: string): number {
  const n = parseInt(timeRange, 10);
  return Number.isFinite(n) ? n : 90;
}

// e.g. "90 Days"
export function horizonLabel(timeRange: string): string {
  return `${horizonDays(timeRange)} Days`;
}

// e.g. "90-Day"
export function horizonShort(timeRange: string): string {
  return `${horizonDays(timeRange)}-Day`;
}

// e.g. "next 90 days"
export function horizonPhrase(timeRange: string): string {
  return `next ${horizonDays(timeRange)} days`;
}

// Per-disease daily projected infection intensity (rough scaling factor).
const DISEASE_FACTOR: Record<string, number> = {
  Ebola: 0.25,
  Marburg: 0.12,
  all: 0.35
};

// Location population scaling.
const LOCATION_FACTOR: Record<string, number> = {
  National: 1,
  'Kigali City': 0.55,
  'Western Province': 0.42,
  'Eastern Province': 0.4,
  'Northern Province': 0.35,
  'Southern Province': 0.38
};

// Projected cumulative infections over the selected horizon for the
// given disease + location. Deterministic so the card and chart agree.
export function projectedInfections(context: DashboardContext): number {
  const days = horizonDays(context.timeRange);
  const dFactor = DISEASE_FACTOR[context.disease] ?? 1;
  const lFactor = LOCATION_FACTOR[context.location] ?? 1;
  // Saturating growth curve: longer horizons accumulate more, but with diminishing returns.
  const cumulative = 600 * Math.pow(days, 1.18) * dFactor * lFactor;
  return Math.round(cumulative);
}

// Human-friendly compact number, e.g. 45,000 -> "45K".
export function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1000)}K`;
  return value.toLocaleString();
}