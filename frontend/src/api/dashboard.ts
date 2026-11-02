import { useQuery } from '@tanstack/react-query';
import { client, unwrap } from './client';

// Module 2 — per-role dashboard summaries. These endpoints return plain JSON (no response
// model in the OpenAPI schema), so their shapes are written out here.

export interface Range {
  low: number;
  median: number;
  high: number;
}

export interface RtPoint {
  day: number;
  cases: number;
  rt: number | null;
  low: number | null;
  high: number | null;
}

export type Trend = 'growing' | 'shrinking' | 'uncertain' | 'not-enough-data';

export interface RtSummary {
  datasetId: string;
  name: string;
  disease: string;
  illustrative: boolean;
  status: string;
  latest: RtPoint | null;
  trend: Trend;
  counts: number[];
  startDate: string | null;
}

export interface RunBrief {
  id: string;
  scenarioId: string;
  scenarioName: string;
  status: string;
  progress: number;
  queuedAt: string;
  requestedBy: string;
  modelType: string;
  summary: {
    peakInfectious: number;
    peakDay: number;
    deaths: number;
    recovered: number;
    ranges?: Record<string, Range | number>;
  } | null;
}

export interface AnalystDashboardData {
  label: string;
  counts: {
    scenarios: number;
    myScenarios: number;
    drafts: number;
    runsThisWeek: number;
    runsActive: number;
    runsCompleted: number;
    reportsDraft: number;
    reportsPending: number;
    reportsApproved: number;
  };
  recentRuns: RunBrief[];
  reports: {id: string;title: string;status: string;disease: string;updated: string;author: string;illustrative: boolean;}[];
  parameterSets: {
    presetId: string;
    disease: string;
    name: string;
    version: number;
    approvedBy: string | null;
    approvedOn: string | null;
    provisional: boolean;
  }[];
  rt: RtSummary[];
}

export interface PolicyDashboardData {
  label: string;
  approvedReports: {
    id: string;
    title: string;
    disease: string;
    approvedBy: string | null;
    approvedOn: string | null;
    summary: string;
    illustrative: boolean;
  }[];
  approvedScenarios: {id: string;name: string;disease: string;runId: string | null;approvedOn: string;illustrative: boolean;}[];
  alerts: {id: string;level: 'high' | 'medium' | 'info';title: string;detail: string;date: string;illustrative: boolean;}[];
  rt: RtSummary[];
}

export interface RtEstimate {
  datasetId: string;
  disease: string;
  presetName: string;
  provisional: boolean;
  startDate: string | null;
  window: number;
  latest: RtPoint | null;
  trend: Trend;
  illustrative: boolean;
  note: string;
  points: RtPoint[];
}

export function useAnalystDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'analyst'],
    queryFn: async () => unwrap(await client.GET('/api/dashboard/analyst')) as unknown as AnalystDashboardData
  });
}

export function usePolicyDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'policymaker'],
    queryFn: async () => unwrap(await client.GET('/api/dashboard/policymaker')) as unknown as PolicyDashboardData
  });
}

/** Daily Rt series for a case dataset (Epidemiologist; policy makers get the latest value from their dashboard). */
export function useRtEstimate(datasetId: string | undefined) {
  return useQuery({
    queryKey: ['dashboard', 'rt-estimate', datasetId],
    enabled: !!datasetId,
    queryFn: async () =>
    unwrap(await client.GET('/api/rt/estimate', { params: { query: { datasetId: datasetId as string } } })) as unknown as RtEstimate
  });
}

export function useInterventionPackageList() {
  return useQuery({
    queryKey: ['dashboard', 'intervention-packages'],
    queryFn: async () => unwrap(await client.GET('/api/intervention-packages'))
  });
}
