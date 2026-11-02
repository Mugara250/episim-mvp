import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import type { components } from './schema';

export type ApiInterventionType = components['schemas']['TypeOut'];
export type ApiTypeIn = components['schemas']['TypeIn'];
export type ApiPackage = components['schemas']['PackageOut'];
export type ApiPackageIn = components['schemas']['PackageIn'];

export const interventionKeys = {
  types: ['intervention-types'] as const,
  levers: ['intervention-levers'] as const,
  packages: ['intervention-packages'] as const
};

export function useInterventionTypesQuery() {
  return useQuery({
    queryKey: interventionKeys.types,
    queryFn: async () => unwrap(await client.GET('/api/intervention-types'))
  });
}

/** The model levers an intervention type can act on (engine_lever). */
export function useLevers() {
  return useQuery({
    queryKey: interventionKeys.levers,
    queryFn: async () => unwrap(await client.GET('/api/intervention-levers')) as {lever: string;description: string;}[],
    staleTime: Infinity
  });
}

export function usePackagesQuery() {
  return useQuery({
    queryKey: interventionKeys.packages,
    queryFn: async () => unwrap(await client.GET('/api/intervention-packages'))
  });
}

export function useInterventionMutations() {
  const qc = useQueryClient();
  const types = () => qc.invalidateQueries({ queryKey: interventionKeys.types });
  const packages = () => qc.invalidateQueries({ queryKey: interventionKeys.packages });
  return {
    createType: useMutation({
      mutationFn: async (body: ApiTypeIn) => unwrap(await client.POST('/api/intervention-types', { body })),
      onSuccess: types
    }),
    updateType: useMutation({
      mutationFn: async ({ id, body }: {id: string;body: ApiTypeIn;}) =>
      unwrap(await client.PUT('/api/intervention-types/{type_id}', { params: { path: { type_id: id } }, body })),
      onSuccess: () => {
        types();
        packages();
      }
    }),
    cloneType: useMutation({
      mutationFn: async (id: string) => unwrap(await client.POST('/api/intervention-types/{type_id}/clone', { params: { path: { type_id: id } } })),
      onSuccess: types
    }),
    createPackage: useMutation({
      mutationFn: async (body: ApiPackageIn) => unwrap(await client.POST('/api/intervention-packages', { body })),
      onSuccess: packages
    }),
    updatePackage: useMutation({
      mutationFn: async ({ id, body }: {id: string;body: ApiPackageIn;}) =>
      unwrap(await client.PUT('/api/intervention-packages/{package_id}', { params: { path: { package_id: id } }, body })),
      onSuccess: packages
    })
  };
}
