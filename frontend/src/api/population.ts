import { useQuery } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { api } from './http';
import type { components } from './schema';
import type { ImportFormat, Mapping, ValidationSummary } from '../types/populationImport';

export type Dataset = components['schemas']['DatasetOut'];
export type DatasetDetail = components['schemas']['DatasetDetail'];
export type ImportJobOut = components['schemas']['ImportJobOut'];

export const populationKeys = {
  datasets: ['population', 'datasets'] as const,
  dataset: (id: string) => ['population', 'datasets', id] as const,
  imports: ['population', 'imports'] as const,
  importJob: (id: string) => ['population', 'imports', id] as const,
  check: ['population', 'check'] as const
};

export function useDatasets(enabled = true) {
  return useQuery({
    queryKey: populationKeys.datasets,
    queryFn: async () => unwrap(await client.GET('/api/population/datasets')),
    enabled
  });
}

export function useDataset(id: string | null) {
  return useQuery({
    queryKey: populationKeys.dataset(id ?? ''),
    queryFn: async () => unwrap(await client.GET('/api/population/datasets/{dataset_id}', { params: { path: { dataset_id: id! } } })),
    enabled: !!id
  });
}

export function useImportJobs() {
  return useQuery({
    queryKey: populationKeys.imports,
    queryFn: async () => unwrap(await client.GET('/api/population/imports'))
  });
}

/** Server-side row check: the same rules the import applies, run over every row of the file. */
export interface CheckResult {
  columns: string[];
  detectedFormat: string;
  format: ImportFormat | null;
  mapping: Mapping;
  missingFields?: string[];
  summary?: ValidationSummary;
  districtTotals?: Record<string, number>;
  error?: string;
}

export function checkImport(file: File, format: ImportFormat, mapping: Mapping) {
  const body = new FormData();
  body.append('file', file);
  body.append('format', format);
  body.append('mapping', JSON.stringify(mapping));
  return api.post<CheckResult>('/population/imports/check', body);
}

export interface StartImportInput {
  file: File;
  format: ImportFormat;
  mapping: Mapping;
  /** Set to add a new version to an existing dataset. */
  datasetId: string | null;
  name: string;
  coverage: string;
  source: string;
  year: string;
}

export function startImport(input: StartImportInput) {
  const body = new FormData();
  body.append('file', input.file);
  body.append('format', input.format);
  body.append('mapping', JSON.stringify(input.mapping));
  if (input.datasetId) body.append('datasetId', input.datasetId);
  body.append('name', input.name);
  body.append('coverage', input.coverage);
  body.append('source', input.source);
  body.append('year', input.year);
  return api.post<ImportJobOut>('/population/imports', body);
}

export async function fetchImportJob(id: string) {
  return unwrap(await client.GET('/api/population/imports/{job_id}', { params: { path: { job_id: id } } }));
}
