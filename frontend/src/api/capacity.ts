import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { components } from './schema';

export type ApiCapacityProfile = components['schemas']['CapacityOut'];
export type ApiCapacityIn = components['schemas']['CapacityIn'];
export type CapacityOption = components['schemas']['CapacityOption'];
export type ApiInstitution = components['schemas']['InstitutionOut'];
export type ApiProfileComparison = components['schemas']['ProfileComparisonOut'];

export const capacityKeys = {
  profiles: ['capacity-profiles'] as const,
  options: ['capacity-profiles', 'options'] as const,
  comparisons: (id: string) => ['capacity-profiles', id, 'comparisons'] as const,
  institutions: ['institutions'] as const
};

export function useCapacityProfilesQuery(enabled = true) {
  return useQuery({
    queryKey: capacityKeys.profiles,
    queryFn: async () => unwrap(await client.GET('/api/capacity-profiles')),
    enabled
  });
}

/** Read-only list for analysis-time selectors (results, comparison, geographic). Any analysing role. */
export function useCapacityOptions(enabled = true) {
  return useQuery({
    queryKey: capacityKeys.options,
    queryFn: async () => unwrap(await client.GET('/api/capacity-profiles/options')),
    enabled
  });
}

export function useInstitutions() {
  return useQuery({
    queryKey: capacityKeys.institutions,
    queryFn: async () => unwrap(await client.GET('/api/institutions')),
    staleTime: 5 * 60_000
  });
}

/** Saved comparisons that use each profile, keyed by profile id. */
export function useProfileComparisons(ids: string[]) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: capacityKeys.comparisons(id),
      queryFn: async () =>
      unwrap(await client.GET('/api/capacity-profiles/{profile_id}/comparisons', { params: { path: { profile_id: id } } }))
    }))
  });
  const map: Record<string, ApiProfileComparison[]> = {};
  ids.forEach((id, i) => {
    if (results[i]?.data) map[id] = results[i].data!;
  });
  return map;
}

export function useCapacityMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: capacityKeys.profiles });
  return {
    create: useMutation({
      mutationFn: async (body: ApiCapacityIn) => unwrap(await client.POST('/api/capacity-profiles', { body })),
      onSuccess: invalidate
    }),
    update: useMutation({
      mutationFn: async ({ id, body }: {id: string;body: ApiCapacityIn;}) =>
      unwrap(await client.PUT('/api/capacity-profiles/{profile_id}', { params: { path: { profile_id: id } }, body })),
      onSuccess: invalidate
    })
  };
}
