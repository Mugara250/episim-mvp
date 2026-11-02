import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { components } from './schema';

// Scenario Comparison (docs Module 12): completed runs side by side, capacity applied at read time.

export type Run = components['schemas']['RunOut'];
export type CapacityOption = components['schemas']['CapacityOption'];

export interface Range {
  low: number | null;
  median: number | null;
  high: number | null;
}

/** Columnar 5th / 50th / 95th percentile bands, one value per day. */
export interface Bands {
  low: number[];
  median: number[];
  high: number[];
}

export interface RunCapacity {
  profileId: string;
  profileName: string;
  placeholder: boolean;
  beds: number;
  pBedsExceeded: number;
  bedsRunOutDay: number | null;
  bedsRunOutDayHigh: number | null;
}

export interface ComparedRun {
  id: string;
  scenarioId: string;
  scenarioName: string | null;
  requestedBy: string;
  completedAt: string | null;
  inputs: {
    horizonDays: number;
    initialCases: number;
    monteCarloRuns: number;
    disease: {name: string;provisional: boolean;reference: string | null;};
    population: {datasetName: string;datasetVersion: number;illustrative: boolean | null;};
    interventions: {packageName: string | null;};
  };
  capacity: RunCapacity | null;
  series: {active: Bands | null;hospitalised: Bands | null;};
}

export interface MetricValue {
  runId: string;
  value: Range | number | null;
  diff: number | null;
  better: boolean | null;
}

export interface Comparison {
  label: string;
  provisional: boolean;
  baselineId: string;
  capacity: {profileId: string;profileName: string;placeholder: boolean;hospitalBeds: number;} | null;
  runs: ComparedRun[];
  differences: {setting: string;values: string[];}[];
  warnings: string[];
  results: {metric: string;label: string;values: MetricValue[];}[];
}

export const comparisonKeys = {
  runs: ['simulations', 'list'] as const,
  options: ['capacity-profiles', 'options'] as const,
  compare: (ids: string[], capacity: string | null, baseline: string | null) =>
  ['comparison', ids.join(','), capacity, baseline] as const
};

/** Every run the user can see; the comparison page shows non-completed ones greyed out. */
export function useRuns() {
  return useQuery({
    queryKey: comparisonKeys.runs,
    queryFn: async () => unwrap(await client.GET('/api/simulations', {})),
    // Keep the list fresh while runs are still in progress elsewhere.
    refetchInterval: (q) => q.state.data?.some((r) => r.status === 'queued' || r.status === 'running') ? 3000 : false
  });
}

/** Read-only capacity profile list used by analysis screens (comparison, geographic). */
export function useCapacityOptions() {
  return useQuery({
    queryKey: comparisonKeys.options,
    queryFn: async () => unwrap(await client.GET('/api/capacity-profiles/options', {}))
  });
}

export function useComparison(ids: string[], capacityId: string | null, baselineId: string | null) {
  return useQuery({
    queryKey: comparisonKeys.compare(ids, capacityId, baselineId),
    enabled: ids.length >= 2,
    queryFn: async () =>
    unwrap(
      await client.GET('/api/comparison', {
        params: {
          query: {
            runIds: ids.join(','),
            capacityProfileId: capacityId ?? undefined,
            baselineId: baselineId ?? undefined
          }
        }
      })
    ) as unknown as Comparison
  });
}

export function useSaveComparison() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {name: string;notes: string;runIds: string[];baselineRunId: string | null;capacityProfileId: string | null;}) =>
    unwrap(await client.POST('/api/scenario-comparisons', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['scenario-comparisons'] })
  });
}
