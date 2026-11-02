import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { RtPoint, Trend } from '../types/simulationRuns';

// Rt Tracking (Module 16): case datasets, their data quality and the Cori estimate.

export type CaseDataset = {
  id: string;
  name: string;
  disease: string;
  source: string;
  startDate: string;
  lastUpdated: string;
  records: number;
  days: number;
  status: 'Passed' | 'Warnings' | 'Failed' | string;
  illustrative: boolean;
  note: string;
};

export interface QualityIssue {
  type: string;
  severity: 'warning' | 'error';
  rows: number | number[] | string[];
}

export interface RtEstimate {
  datasetId: string;
  disease: string;
  presetName: string;
  provisional: boolean;
  serialInterval: {mean: number;sd: number;};
  startDate: string;
  window: number;
  points: RtPoint[];
  latest: RtPoint | null;
  trend: Trend;
  illustrative: boolean;
  note: string;
}

export const rtKeys = {
  datasets: ['rt', 'datasets'] as const,
  quality: (id: string) => ['rt', 'datasets', id, 'quality'] as const,
  estimate: (id: string, window: number) => ['rt', 'estimate', id, window] as const
};

export function useCaseDatasets() {
  return useQuery({
    queryKey: rtKeys.datasets,
    queryFn: async () => unwrap(await client.GET('/api/rt/datasets', {})) as unknown as CaseDataset[]
  });
}

export function useCaseQuality(id: string | null) {
  return useQuery({
    queryKey: rtKeys.quality(id ?? ''),
    enabled: !!id,
    queryFn: async () =>
    unwrap(await client.GET('/api/rt/datasets/{ds_id}/quality', { params: { path: { ds_id: id! } } })) as unknown as {
      datasetId: string;
      status: string;
      issues: QualityIssue[];
    }
  });
}

export function useRtEstimate(id: string | null, window: number) {
  return useQuery({
    queryKey: rtKeys.estimate(id ?? '', window),
    enabled: !!id,
    placeholderData: (prev) => prev,
    queryFn: async () =>
    unwrap(await client.GET('/api/rt/estimate', { params: { query: { datasetId: id!, window } } })) as unknown as RtEstimate
  });
}

export function useCaseEntry(id: string | null) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['rt'] });
  const add = useMutation({
    mutationFn: async (newCases: number) =>
    unwrap(await client.POST('/api/rt/datasets/{ds_id}/records', { params: { path: { ds_id: id! } }, body: { newCases, location: '' } })),
    onSuccess: refresh
  });
  const undo = useMutation({
    mutationFn: async () => unwrap(await client.DELETE('/api/rt/datasets/{ds_id}/records/last', { params: { path: { ds_id: id! } } })),
    onSuccess: refresh
  });
  return { add, undo };
}
