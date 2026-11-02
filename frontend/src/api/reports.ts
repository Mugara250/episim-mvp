import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { ApiError, authHeaders, errorMessage, handleUnauthorized } from './http';
import type { components } from './schema';

// Module 13 — reports, approval workflow and server-side PDF exports.

export type Report = components['schemas']['ReportOut'];
export type ReportInput = components['schemas']['ReportIn'];
export type ReportExport = components['schemas']['ExportOut'];
export type SavedComparison = components['schemas']['ComparisonOut'];
export type Run = components['schemas']['RunOut'];
export type ReportStatus = 'draft' | 'pending_approval' | 'approved';

export const STATUS_LABEL: Record<ReportStatus, 'Draft' | 'Pending approval' | 'Approved'> = {
  draft: 'Draft',
  pending_approval: 'Pending approval',
  approved: 'Approved'
};

export const statusLabel = (s: string) => STATUS_LABEL[s as ReportStatus] ?? 'Draft';

export const reportKeys = {
  all: ['reports'] as const,
  list: (status?: string) => ['reports', 'list', status ?? 'all'] as const,
  one: (id: string) => ['reports', 'one', id] as const
};

export function useReports(status?: string) {
  return useQuery({
    queryKey: reportKeys.list(status),
    queryFn: async () => unwrap(await client.GET('/api/reports', { params: { query: { status } } }))
  });
}

/** Completed runs the user can link a report to. */
export function useCompletedRuns(enabled = true) {
  return useQuery({
    queryKey: ['reports', 'completed-runs'],
    enabled,
    queryFn: async () =>
    unwrap(await client.GET('/api/simulations', { params: { query: { status: 'completed' } } })) as Run[]
  });
}

export function useSavedComparisons(enabled = true) {
  return useQuery({
    queryKey: ['reports', 'saved-comparisons'],
    enabled,
    queryFn: async () => unwrap(await client.GET('/api/scenario-comparisons'))
  });
}

function useReportMutation<V>(fn: (v: V) => Promise<Report>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportKeys.all });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
    }
  });
}

export function useCreateReport() {
  return useReportMutation(async (body: ReportInput) => unwrap(await client.POST('/api/reports', { body })));
}

export function useUpdateReport() {
  return useReportMutation(async ({ id, body }: {id: string;body: ReportInput;}) =>
  unwrap(await client.PUT('/api/reports/{rid}', { params: { path: { rid: id } }, body }))
  );
}

export function useSubmitReport() {
  return useReportMutation(async (id: string) =>
  unwrap(await client.POST('/api/reports/{rid}/submit', { params: { path: { rid: id } } }))
  );
}

export function useReturnReport() {
  return useReportMutation(async (id: string) =>
  unwrap(await client.POST('/api/reports/{rid}/return', { params: { path: { rid: id } } }))
  );
}

export function useApproveReport() {
  return useReportMutation(async (id: string) =>
  unwrap(await client.POST('/api/reports/{rid}/approve', { params: { path: { rid: id } } }))
  );
}

/** Generates a PDF on the server, then downloads it. */
export function useExportReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (report: Pick<Report, 'id'>) => {
      const exp = unwrap(
        await client.POST('/api/reports/{rid}/exports', {
          params: { path: { rid: report.id } },
          body: { format: 'pdf' }
        })
      );
      if (exp.status !== 'completed' || !exp.downloadUrl) {
        throw new ApiError(500, exp.errorMessage ?? 'The PDF could not be generated. Try again.');
      }
      await downloadFile(exp.downloadUrl, `${report.id}.pdf`);
      return exp;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: reportKeys.all })
  });
}

/** Downloads an authenticated file (a plain link can't carry the bearer token). */
export async function downloadFile(url: string, fallbackName: string) {
  const res = await fetch(url, { headers: authHeaders() });
  if (res.status === 401) handleUnauthorized();
  if (!res.ok) {
    let detail: unknown;
    try {
      detail = (await res.json()).detail;
    } catch {
      detail = undefined;
    }
    throw new ApiError(res.status, errorMessage(detail, 'The file could not be downloaded.'), detail);
  }
  const disposition = res.headers.get('Content-Disposition') ?? '';
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const name = match ? decodeURIComponent(match[1]) : fallbackName;
  const href = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = href;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}

/** Latest completed export for a report, if any. */
export const latestExport = (r: Report) => r.exports?.find((e) => e.status === 'completed' && e.downloadUrl);

export function formatDate(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "ebola" → "Ebola" for display. */
export const diseaseLabel = (key: string | null | undefined) =>
key ? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ') : '—';
