import { useQueries, useQuery } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { components } from './schema';

// Policy-maker content: approved scenarios (with their run's results), intervention reviews, alerts.

export type ApprovedScenario = components['schemas']['ApprovedScenarioOut'];
export type InterventionReview = components['schemas']['ReviewOut'];

export interface Range {
  low: number;
  median: number;
  high: number;
}

/** One day of a fan chart: 5th, 50th and 95th percentile across Monte Carlo runs. */
export interface DayBand extends Range {
  day: number;
}

export interface ColumnarBand {
  low: number[];
  median: number[];
  high: number[];
}

export interface RunResults {
  runId: string;
  label: string;
  provisional: boolean | null;
  notes: string[];
  summary: {
    pTakeOff: number;
    finalCases: Range;
    finalDeaths: Range;
    peakBeds: Range;
    hcwShare?: Range;
  };
  capacity: {beds: number;pBedsExceeded: number;bedsRunOutDay?: number | null;profileName?: string;} | null;
}

export interface RunSeries {
  runId: string;
  days: number;
  series: Record<string, ColumnarBand | undefined>;
}

/** Columnar bands from the API → one row per day for the chart. */
export function toDayBands(b: ColumnarBand | undefined): DayBand[] {
  if (!b) return [];
  return b.median.map((median, day) => ({ day, low: b.low[day] ?? median, median, high: b.high[day] ?? median }));
}

export function useApprovedScenarios() {
  return useQuery({
    queryKey: ['policy', 'approved-scenarios'],
    queryFn: async () => unwrap(await client.GET('/api/approved-scenarios'))
  });
}

export function useInterventionReviews() {
  return useQuery({
    queryKey: ['policy', 'intervention-reviews'],
    queryFn: async () => unwrap(await client.GET('/api/intervention-reviews'))
  });
}

/** Results and daily series for several runs (approved scenarios). */
export function useRunResultsMany(runIds: string[]) {
  const results = useQueries({
    queries: runIds.map((id) => ({
      queryKey: ['policy', 'run-results', id],
      queryFn: async () =>
      unwrap(await client.GET('/api/simulations/{run_id}/results', { params: { path: { run_id: id } } })) as unknown as RunResults
    }))
  });
  const series = useQueries({
    queries: runIds.map((id) => ({
      queryKey: ['policy', 'run-series', id],
      queryFn: async () =>
      unwrap(await client.GET('/api/simulations/{run_id}/results/series', { params: { path: { run_id: id } } })) as unknown as RunSeries
    }))
  });
  return { results, series };
}

export const rangeText = (r: Range | undefined, digits = 0) =>
r ? `${fmt(r.low, digits)} to ${fmt(r.high, digits)}` : '—';

export const fmt = (v: number, digits = 0) =>
v.toLocaleString('en-US', { maximumFractionDigits: digits, minimumFractionDigits: digits });

/** "7 in 10" style wording for a probability. */
export const inTen = (p: number) => `${Math.round(p * 10)} in 10`;
