import { useMutation, useQuery } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { HcwResults, HcwSettings, HcwWhatIf } from '../types/simulationRuns';

// Health-worker layer (Module 15): results of a completed run and a reduced-run "what if" preview.

export function useHcwResults(runId: string | null) {
  return useQuery({
    queryKey: ['simulations', runId ?? '', 'health-workers'],
    enabled: !!runId,
    staleTime: Infinity,
    queryFn: async () =>
    unwrap(await client.GET('/api/simulations/{run_id}/results/health-workers', { params: { path: { run_id: runId! } } })) as unknown as HcwResults
  });
}

export function useHcwWhatIf(runId: string | null) {
  return useMutation({
    mutationFn: async (s: Partial<HcwSettings>) =>
    unwrap(
      await client.POST('/api/simulations/{run_id}/health-workers/what-if', {
        params: { path: { run_id: runId! } },
        body: { pool: s.pool ?? null, ppeBefore: s.ppeBefore ?? null, ppeAfter: s.ppeAfter ?? null, recognitionDay: s.recognitionDay ?? null }
      })
    ) as unknown as HcwWhatIf
  });
}

/** Engine snapshot settings (snake_case) → form settings. */
export function hcwFromSnapshot(s: Record<string, number> | null | undefined): HcwSettings | null {
  if (!s) return null;
  return { pool: s.pool, ppeBefore: s.ppe_before, ppeAfter: s.ppe_after, recognitionDay: s.recognition_day };
}
