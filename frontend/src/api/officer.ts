import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { api } from './http';
import { useAuth } from '../context/AuthContext';
import type { components } from './schema';
import type {
  HospitalEntry,
  HospitalReport,
  Instruction,
  InstructionStatus,
  OfficerDisease,
  PpeLevel,
  ResponsePlan } from
'../types/officer';

// Module 17 — hospital data and response operations, scoped server-side to the officer's own hospital.

type EntryOut = components['schemas']['EntryOut'];
type InstructionOut = components['schemas']['InstructionOut'];
type PlanOut = components['schemas']['PlanOut'];
type ReportOut = components['schemas']['ReportOut'];

export interface OwnHospital {
  id: string;
  name: string;
  district: string;
  province: string;
  isolationBeds: number | null;
  /** Server date, ISO yyyy-mm-dd */
  today: string;
}

const KEYS = {
  hospital: ['hospital', 'me'] as const,
  entries: ['hospital', 'entries'] as const,
  instructions: ['hospital', 'instructions'] as const,
  plans: ['hospital', 'plans'] as const,
  reports: ['hospital', 'reports'] as const
};

function useIsOfficer() {
  const { status, role } = useAuth();
  return status === 'authenticated' && role === 'officer';
}

const PROVINCE_NAMES: Record<string, string> = {
  kigali: 'Kigali City',
  northern: 'Northern Province',
  southern: 'Southern Province',
  eastern: 'Eastern Province',
  western: 'Western Province'
};

export function useOwnHospital() {
  const enabled = useIsOfficer();
  return useQuery({
    queryKey: KEYS.hospital,
    enabled,
    queryFn: async (): Promise<OwnHospital> => {
      const h = unwrap(await client.GET('/api/hospital/me'));
      return {
        id: h.id,
        name: h.name,
        district: h.district ?? '—',
        province: h.province ? PROVINCE_NAMES[h.province] ?? h.province : '—',
        isolationBeds: h.isolationBeds ?? null,
        today: h.today
      };
    }
  });
}

const toEntry = (e: EntryOut): HospitalEntry => ({
  id: e.id,
  date: e.date,
  disease: e.disease as OfficerDisease,
  suspected: e.suspected ?? 0,
  confirmed: e.confirmed ?? 0,
  inIsolation: e.inIsolation ?? 0,
  recovered: e.recovered ?? 0,
  deaths: e.deaths ?? 0,
  hcwInfected: e.hcwInfected ?? 0,
  bedsTotal: e.bedsTotal ?? 0,
  bedsOccupied: e.bedsOccupied ?? 0,
  ppeStock: (e.ppeStock ?? 'Good') as PpeLevel,
  trainedStaff: e.trainedStaff ?? 0,
  burialTeamReady: e.burialTeamReady ?? true,
  contactsFollowUp: e.contactsFollowUp ?? 0,
  illustrative: e.illustrative
});

export function useHospitalEntries() {
  const enabled = useIsOfficer();
  return useQuery({
    queryKey: KEYS.entries,
    enabled,
    queryFn: async () => unwrap(await client.GET('/api/hospital/entries')).map(toEntry)
  });
}

export type EntryCounts = Omit<HospitalEntry, 'id' | 'date' | 'disease' | 'illustrative'>;

export function useSaveEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {date: string;disease: OfficerDisease;counts: EntryCounts;}) =>
    toEntry(unwrap(await client.POST('/api/hospital/entries', { body: { ...v.counts, date: v.date, disease: v.disease } }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEYS.entries });
      qc.invalidateQueries({ queryKey: ['dashboard', 'officer'] });
    }
  });
}

const toInstruction = (i: InstructionOut): Instruction => ({
  id: i.id,
  action: i.action,
  target: i.target,
  deadline: i.deadline,
  from: i.fromName,
  disease: i.disease as OfficerDisease,
  received: i.received,
  status: i.status as InstructionStatus,
  reason: i.reason ?? undefined,
  illustrative: i.illustrative
});

export function useInstructions() {
  const enabled = useIsOfficer();
  return useQuery({
    queryKey: KEYS.instructions,
    enabled,
    queryFn: async () => unwrap(await client.GET('/api/hospital/instructions')).map(toInstruction)
  });
}

export function useSetInstructionStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {id: string;status: InstructionStatus;reason?: string;}) =>
    toInstruction(
      unwrap(
        await client.PUT('/api/hospital/instructions/{iid}/status', {
          params: { path: { iid: v.id } },
          body: { status: v.status, reason: v.status === "Can't do" ? v.reason ?? null : null }
        })
      )
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.instructions })
  });
}

const toPlan = (p: PlanOut): ResponsePlan => ({
  id: p.id,
  title: p.title,
  disease: p.disease as OfficerDisease,
  status: (p.status ?? 'Draft') as ResponsePlan['status'],
  startDate: p.startDate,
  reviewDate: p.reviewDate,
  actions: (p.actions ?? []).map((a) => ({ name: a.name, target: a.target ?? '' })),
  notes: p.notes ?? '',
  updated: p.updated.slice(0, 10),
  illustrative: p.illustrative
});

export function usePlans() {
  const enabled = useIsOfficer();
  return useQuery({
    queryKey: KEYS.plans,
    enabled,
    queryFn: async () => unwrap(await client.GET('/api/hospital/plans')).map(toPlan)
  });
}

export type PlanInput = Omit<ResponsePlan, 'id' | 'updated' | 'illustrative'>;

export function useSavePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (v: {plan: PlanInput;id?: string;}) => {
      const body = v.plan;
      return toPlan(
        unwrap(
          v.id ?
          await client.PUT('/api/hospital/plans/{pid}', { params: { path: { pid: v.id } }, body }) :
          await client.POST('/api/hospital/plans', { body })
        )
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.plans })
  });
}

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.DELETE('/api/hospital/plans/{pid}', { params: { path: { pid: id } } });
      if (!res.response.ok) unwrap(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.plans })
  });
}

const REPORT_TYPES: Record<string, HospitalReport['type']> = {
  weekly_situation: 'Weekly situation',
  scenario_brief: 'Scenario brief',
  capacity_review: 'Capacity review'
};

interface Figure {
  label?: string;
  value?: unknown;
  range?: unknown;
  low?: unknown;
  high?: unknown;
}

const toHospitalReport = (r: ReportOut): HospitalReport => ({
  id: r.id,
  title: r.title,
  type: REPORT_TYPES[r.reportType] ?? 'Scenario brief',
  period: r.period ?? '—',
  published: new Date(r.approvedOn ?? r.updated).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
  by: r.author,
  summary: r.summary,
  figures: (r.figures as Figure[]).map((f) => ({
    label: String(f.label ?? ''),
    value: String(f.value ?? ''),
    range: f.range != null ? String(f.range) : f.low != null && f.high != null ? `${f.low}–${f.high} (5–95%)` : ''
  })),
  illustrative: r.illustrative,
  estimateNote: r.estimateNote,
  exports: r.exports
});

/** Approved reports for the officer's own hospital (the server filters by hospital and status). */
export function useHospitalReports() {
  const enabled = useIsOfficer();
  return useQuery({
    queryKey: KEYS.reports,
    enabled,
    queryFn: async () =>
    unwrap(await client.GET('/api/reports')).
    filter((r) => r.audience === 'hospital').
    map(toHospitalReport)
  });
}

/** Generates a server-side PDF for a report the officer can see, then downloads it. */
export async function downloadReportPdf(reportId: string) {
  const exp = await api.post<{id: string;status: string;errorMessage: string | null;}>(`/reports/${reportId}/exports`, { format: 'pdf' });
  if (exp.status !== 'completed') throw new Error(exp.errorMessage ?? 'The PDF could not be generated.');
  const blob = await api.get<Blob>(`/reports/${reportId}/exports/${exp.id}/download`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${reportId}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
