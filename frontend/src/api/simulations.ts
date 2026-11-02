import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type {
  RunRequest,
  RunResults,
  RunRt,
  RunSeries,
  SimulationRun } from
'../types/simulationRuns';

// Simulation runs (Module 5) and their results (Modules 6, 11, 16).
// Runs are executed by the backend worker; the client polls while any run is queued or running.

export const simulationKeys = {
  all: ['simulations'] as const,
  run: (id: string) => ['simulations', id] as const,
  results: (id: string, capacityId: string | null) => ['simulations', id, 'results', capacityId ?? 'none'] as const,
  series: (id: string) => ['simulations', id, 'series'] as const,
  rt: (id: string) => ['simulations', id, 'rt'] as const,
  capacityOptions: ['capacity-profiles', 'options'] as const,
  districts: ['geographic', 'districts'] as const
};

const POLL_MS = 1000;
const isActive = (r: SimulationRun) => r.status === 'queued' || r.status === 'running';

export function useRunList() {
  return useQuery({
    queryKey: simulationKeys.all,
    queryFn: async () => unwrap(await client.GET('/api/simulations', {})) as unknown as SimulationRun[],
    refetchInterval: (q) => (q.state.data ?? []).some(isActive) ? POLL_MS : false
  });
}

export function useRun(id: string | null | undefined) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: simulationKeys.run(id ?? ''),
    enabled: !!id,
    queryFn: async () => {
      const run = unwrap(await client.GET('/api/simulations/{run_id}', { params: { path: { run_id: id! } } })) as unknown as SimulationRun;
      // Keep the history list in step with the run being watched.
      qc.setQueryData<SimulationRun[]>(simulationKeys.all, (list) => list?.map((r) => r.id === run.id ? run : r));
      return run;
    },
    refetchInterval: (q) => q.state.data && isActive(q.state.data) ? POLL_MS : false
  });
}

export function useStartRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (req: RunRequest) =>
    unwrap(
      await client.POST('/api/simulations', {
        body: {
          scenarioId: req.scenarioId,
          horizonDays: req.horizonDays,
          initialCases: req.initialCases,
          modelType: req.modelType ?? 'seihfr',
          seedDistrictCode: req.seedDistrictCode ?? null,
          monteCarloRuns: req.monteCarloRuns ?? 200,
          seed: req.seed ?? null,
          hcw: req.hcw ?? null
        }
      })
    ) as unknown as SimulationRun,
    onSuccess: (run) => {
      qc.setQueryData<SimulationRun[]>(simulationKeys.all, (list) => [run, ...(list ?? []).filter((r) => r.id !== run.id)]);
      qc.setQueryData(simulationKeys.run(run.id), run);
      qc.invalidateQueries({ queryKey: simulationKeys.all });
      qc.invalidateQueries({ queryKey: ['scenarios'] });
    }
  });
}

export function useCancelRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) =>
    unwrap(await client.POST('/api/simulations/{run_id}/cancel', { params: { path: { run_id: id } } })) as unknown as SimulationRun,
    onSuccess: (run) => {
      qc.setQueryData(simulationKeys.run(run.id), run);
      qc.invalidateQueries({ queryKey: simulationKeys.all });
    }
  });
}

export function useRunResults(id: string | null | undefined, capacityProfileId: string | null, enabled = true) {
  return useQuery({
    queryKey: simulationKeys.results(id ?? '', capacityProfileId),
    enabled: !!id && enabled,
    placeholderData: (prev) => prev,
    queryFn: async () =>
    unwrap(
      await client.GET('/api/simulations/{run_id}/results', {
        params: { path: { run_id: id! }, query: { capacityProfileId: capacityProfileId ?? undefined } }
      })
    ) as unknown as RunResults
  });
}

export function useRunSeries(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: simulationKeys.series(id ?? ''),
    enabled: !!id && enabled,
    staleTime: Infinity, // results of a completed run never change
    queryFn: async () =>
    unwrap(await client.GET('/api/simulations/{run_id}/results/series', { params: { path: { run_id: id! } } })) as unknown as RunSeries
  });
}

export function useRunRt(id: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: simulationKeys.rt(id ?? ''),
    enabled: !!id && enabled,
    staleTime: Infinity,
    queryFn: async () =>
    unwrap(await client.GET('/api/simulations/{run_id}/results/rt', { params: { path: { run_id: id! } } })) as unknown as RunRt
  });
}

export interface CapacityOption {
  id: string;
  name: string;
  institutionName: string | null;
  hospitalBeds: number;
  hasDistrictBeds: boolean;
  placeholder: boolean;
}

export function useCapacityOptions() {
  return useQuery({
    queryKey: simulationKeys.capacityOptions,
    queryFn: async () => unwrap(await client.GET('/api/capacity-profiles/options', {})) as unknown as CapacityOption[]
  });
}

export interface DistrictOption {
  code: string;
  name: string;
  province: string;
}

/** The 30 districts (names only) for the seed-district picker. */
export function useDistrictOptions(enabled = true) {
  return useQuery({
    queryKey: simulationKeys.districts,
    enabled,
    staleTime: Infinity,
    queryFn: async () => unwrap(await client.GET('/api/geographic/districts', {})) as unknown as {
      features: {properties: DistrictOption;}[];
    },
    select: (fc) => fc.features.map((f) => f.properties).sort((a, b) => a.name.localeCompare(b.name))
  });
}
