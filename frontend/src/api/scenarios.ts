import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type {
  InterventionTypeRef,
  PackageRef,
  PopulationDataset,
  PresetRef,
  Scenario,
  ScenarioDraft,
  SharePermission } from
'../types/scenarios';

// Scenario Builder: scenarios plus the reference lists the builder picks from.
// Reference queries use the same keys as their own pages (raw endpoint data), so edits there refresh here.

export const scenarioKeys = {
  all: ['scenarios'] as const,
  shareTargets: ['scenarios', 'share-targets'] as const,
  presets: ['disease-presets'] as const,
  packages: ['intervention-packages'] as const,
  types: ['intervention-types'] as const,
  datasets: ['population-datasets', 'options'] as const
};

export function useScenarioList() {
  return useQuery({
    queryKey: scenarioKeys.all,
    queryFn: async () => unwrap(await client.GET('/api/scenarios', {})) as Scenario[]
  });
}

export function usePresetRefs() {
  return useQuery({
    queryKey: scenarioKeys.presets,
    queryFn: async () => unwrap(await client.GET('/api/disease-presets', {})) as PresetRef[]
  });
}

export function usePackageRefs() {
  return useQuery({
    queryKey: scenarioKeys.packages,
    queryFn: async () => unwrap(await client.GET('/api/intervention-packages', {})) as PackageRef[]
  });
}

export function useTypeRefs() {
  return useQuery({
    queryKey: scenarioKeys.types,
    queryFn: async () => unwrap(await client.GET('/api/intervention-types', {})) as InterventionTypeRef[]
  });
}

export function useDatasetRefs() {
  return useQuery({
    queryKey: scenarioKeys.datasets,
    queryFn: async () => unwrap(await client.GET('/api/population/datasets/options', {})) as PopulationDataset[]
  });
}

/** Everything the builder and run summaries need to describe a scenario. */
export function useScenarioRefs() {
  const presets = usePresetRefs();
  const packages = usePackageRefs();
  const types = useTypeRefs();
  const datasets = useDatasetRefs();
  return {
    presets: presets.data ?? [],
    packages: packages.data ?? [],
    types: types.data ?? [],
    datasets: datasets.data ?? [],
    isLoading: presets.isLoading || packages.isLoading || types.isLoading || datasets.isLoading,
    error: presets.error ?? packages.error ?? types.error ?? datasets.error
  };
}

export type ScenarioRefs = ReturnType<typeof useScenarioRefs>;

export interface ShareTargets {
  users: {id: string;name: string;role: string;institution: string | null;}[];
  institutions: {id: string;name: string;kind: string;}[];
}

export function useShareTargets(enabled = true) {
  return useQuery({
    queryKey: scenarioKeys.shareTargets,
    enabled,
    queryFn: async () => unwrap(await client.GET('/api/scenarios/share-targets', {})) as unknown as ShareTargets
  });
}

const body = (d: ScenarioDraft, draft: boolean) => ({
  name: d.name.trim(),
  description: d.description.trim(),
  datasetId: d.datasetId,
  presetId: d.presetId,
  packageId: d.packageId,
  visibility: d.visibility,
  draft
});

export function useScenarioMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: scenarioKeys.all });
  const options = { onSuccess: invalidate };

  const create = useMutation({
    ...options,
    mutationFn: async ({ draft, asDraft }: {draft: ScenarioDraft;asDraft: boolean;}) =>
    unwrap(await client.POST('/api/scenarios', { body: body(draft, asDraft) })) as Scenario
  });
  const update = useMutation({
    ...options,
    mutationFn: async ({ id, draft, asDraft }: {id: string;draft: ScenarioDraft;asDraft: boolean;}) =>
    unwrap(await client.PUT('/api/scenarios/{scenario_id}', { params: { path: { scenario_id: id } }, body: body(draft, asDraft) })) as Scenario
  });
  /** Clones the source (keeps lineage on the server), then applies the builder's edits to the copy. */
  const cloneAndSave = useMutation({
    ...options,
    mutationFn: async ({ fromId, draft, asDraft }: {fromId: string;draft: ScenarioDraft;asDraft: boolean;}) => {
      const copy = unwrap(
        await client.POST('/api/scenarios/{scenario_id}/clone', { params: { path: { scenario_id: fromId } }, body: { name: draft.name.trim() || null } })
      ) as Scenario;
      return unwrap(
        await client.PUT('/api/scenarios/{scenario_id}', { params: { path: { scenario_id: copy.id } }, body: body(draft, asDraft) })
      ) as Scenario;
    }
  });
  const remove = useMutation({
    ...options,
    mutationFn: async (id: string) => {
      const res = await client.DELETE('/api/scenarios/{scenario_id}', { params: { path: { scenario_id: id } } });
      unwrap(res);
      return id;
    }
  });
  const setShares = useMutation({
    ...options,
    mutationFn: async ({ id, shares }: {id: string;shares: {kind: 'user' | 'institution';targetId: string;permission: SharePermission;}[];}) =>
    unwrap(await client.PUT('/api/scenarios/{scenario_id}/shares', { params: { path: { scenario_id: id } }, body: { shares } })) as Scenario
  });
  return { create, update, cloneAndSave, remove, setShares };
}
