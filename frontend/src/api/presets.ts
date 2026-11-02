import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { components } from './schema';

/** A SEIHFR disease preset as stored on the server (docs Module 4). */
export type Preset = components['schemas']['PresetOut'];
export type PresetFields = components['schemas']['PresetFields'];
export type PresetCreate = components['schemas']['PresetIn'];

export const presetKeys = {
  all: ['disease-presets'] as const
};

export function usePresets() {
  return useQuery({
    queryKey: presetKeys.all,
    queryFn: async () => unwrap(await client.GET('/api/disease-presets'))
  });
}

export function usePresetMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: presetKeys.all });
  const create = useMutation({
    mutationFn: async (body: PresetCreate) => unwrap(await client.POST('/api/disease-presets', { body })),
    onSuccess: invalidate
  });
  const update = useMutation({
    mutationFn: async ({ id, body }: {id: string;body: PresetFields;}) =>
    unwrap(await client.PUT('/api/disease-presets/{preset_id}', { params: { path: { preset_id: id } }, body })),
    onSuccess: invalidate
  });
  const clone = useMutation({
    mutationFn: async ({ id, name }: {id: string;name?: string;}) =>
    unwrap(await client.POST('/api/disease-presets/{preset_id}/clone', { params: { path: { preset_id: id } }, body: { name: name ?? null } })),
    onSuccess: invalidate
  });
  const approve = useMutation({
    mutationFn: async ({ id, clearProvisional }: {id: string;clearProvisional: boolean;}) =>
    unwrap(
      await client.POST('/api/disease-presets/{preset_id}/approve', {
        params: { path: { preset_id: id } },
        body: { clearProvisional }
      })
    ),
    onSuccess: invalidate
  });
  return { create, update, clone, approve };
}
