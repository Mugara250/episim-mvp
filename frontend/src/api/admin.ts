import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { api } from './http';
import { useAuth } from '../context/AuthContext';
import type { components } from './schema';
import type { Role } from '../lib/rbac';
import type { AccountStatus, AdminUser, AuditEntry, Hospital } from '../types/admin';

// Module 14 — administrator console. Every call here needs the admin role; the server enforces it.

type AdminUserOut = components['schemas']['AdminUserOut'];
type AdminHospitalOut = components['schemas']['app__api__admin__HospitalOut'];

export const ADMIN_KEYS = {
  users: ['admin', 'users'] as const,
  hospitals: ['admin', 'hospitals'] as const,
  institutions: ['institutions'] as const,
  audit: ['admin', 'audit'] as const,
  health: ['admin', 'health'] as const,
  announcements: ['admin', 'announcements'] as const,
  tickets: ['admin', 'tickets'] as const,
  settings: ['admin', 'settings'] as const,
  requests: ['admin', 'access-requests'] as const
};

export function useIsAdmin() {
  const { status, role } = useAuth();
  return status === 'authenticated' && role === 'admin';
}

export function formatStamp(iso: string | null | undefined) {
  if (!iso) return 'Never';
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

const toUser = (u: AdminUserOut): AdminUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role as Role,
  organisation: u.organisation ?? u.institutionName ?? '—',
  institutionId: u.institutionId ?? undefined,
  hospitalId: u.hospitalId ?? undefined,
  status: u.status as AccountStatus,
  lastLogin: formatStamp(u.lastLogin),
  isDemo: u.isDemo,
  canEditBuiltins: u.canEditBuiltins,
  illustrative: u.illustrative
});

export function useAdminUsers() {
  return useQuery({
    queryKey: ADMIN_KEYS.users,
    enabled: useIsAdmin(),
    queryFn: async () => unwrap(await client.GET('/api/admin/users')).map(toUser)
  });
}

const toHospital = (h: AdminHospitalOut): Hospital => ({
  id: h.id,
  name: h.name,
  district: h.district,
  isolationBeds: h.isolationBeds,
  registered: h.registered ?? '—',
  kind: h.kind as Hospital['kind'],
  illustrative: h.illustrative
});

export function useAdminHospitals() {
  return useQuery({
    queryKey: ADMIN_KEYS.hospitals,
    enabled: useIsAdmin(),
    queryFn: async () => unwrap(await client.GET('/api/admin/hospitals')).map(toHospital)
  });
}

export interface Institution {
  id: string;
  name: string;
  kind: string;
}

export function useInstitutions() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ADMIN_KEYS.institutions,
    enabled: status === 'authenticated',
    queryFn: async (): Promise<Institution[]> => unwrap(await client.GET('/api/institutions'))
  });
}

export interface UserInput {
  name: string;
  email: string;
  role: Role;
  institutionId?: string;
  status: AccountStatus;
  title?: string | null;
  /** Required for new accounts; optional reset when editing. */
  password?: string;
  /** Lets an Epidemiologist edit built-in presets; kept unchanged by the user form. */
  canEditBuiltins?: boolean;
}

export function useSaveUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, id }: {input: UserInput;id?: string;}) => {
      const body = {
        name: input.name,
        email: input.email,
        role: input.role,
        title: input.title ?? null,
        institutionId: input.institutionId ?? null,
        status: input.status,
        password: input.password ? input.password : null,
        canEditBuiltins: input.canEditBuiltins ?? false
      };
      return toUser(
        unwrap(
          id ?
          await client.PUT('/api/admin/users/{uid}', { params: { path: { uid: id } }, body }) :
          await client.POST('/api/admin/users', { body })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

export function useSetUserStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: {id: string;status: 'Active' | 'Inactive';}) =>
    toUser(unwrap(await client.PUT('/api/admin/users/{uid}/status', { params: { path: { uid: id } }, body: { status } }))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

export type HospitalInput = Pick<Hospital, 'name' | 'district' | 'isolationBeds'> & {kind?: Hospital['kind'];};

export function useSaveHospital() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, id }: {input: HospitalInput;id?: string;}) => {
      const body = { ...input, kind: input.kind ?? 'District hospital catchment' };
      return toHospital(
        unwrap(
          id ?
          await client.PUT('/api/admin/hospitals/{hid}', { params: { path: { hid: id } }, body }) :
          await client.POST('/api/admin/hospitals', { body })
        )
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.hospitals });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.institutions });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

// ── Audit log ───────────────────────────────────────────

export interface AuditFilters {
  q?: string;
  action?: string;
  user?: string;
  since?: string;
  limit?: number;
  offset?: number;
}

interface AuditPage {
  total: number;
  actions: string[];
  items: AuditEntry[];
}

interface RawAudit {
  id: number;
  time: string;
  user: string;
  role: string;
  action: string;
  target: string;
  details: string;
  illustrative: boolean;
}

export function useAuditLog(filters: AuditFilters) {
  return useQuery({
    queryKey: [...ADMIN_KEYS.audit, filters],
    enabled: useIsAdmin(),
    placeholderData: keepPreviousData,
    queryFn: async (): Promise<AuditPage> => {
      const page = await api.get<{total: number;actions: string[];items: RawAudit[];}>('/admin/audit-log', {
        query: { ...filters, q: filters.q || undefined, action: filters.action || undefined, user: filters.user || undefined }
      });
      return {
        total: page.total,
        actions: page.actions,
        items: page.items.map((a) => ({ ...a, id: String(a.id), time: formatStamp(a.time) }))
      };
    }
  });
}

// ── System health (real checks only) ────────────────────

export interface SystemHealth {
  checkedAt: string;
  appVersion: string;
  engineVersion: string;
  database: {ok: boolean;driver: string;sizeBytes: number | null;};
  worker: {threads: number;queueDepth: number;};
  runs: Record<'queued' | 'running' | 'completed' | 'failed' | 'cancelled', number>;
  recentRunSeconds: {count: number;mean: number | null;max: number | null;};
  imports: Record<string, number>;
  reports: Record<string, number>;
  users: {active: number;};
  disk: {totalBytes: number;freeBytes: number;};
  demoMode: boolean;
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ADMIN_KEYS.health,
    enabled: useIsAdmin(),
    refetchInterval: 15_000,
    queryFn: () => api.get<SystemHealth>('/admin/system-health')
  });
}

// ── Announcements ───────────────────────────────────────

export type ApiAnnouncement = components['schemas']['AnnouncementOut'];
export type AnnouncementInput = components['schemas']['AnnouncementIn'];

export function useAnnouncements() {
  return useQuery({
    queryKey: ADMIN_KEYS.announcements,
    enabled: useIsAdmin(),
    queryFn: async () => unwrap(await client.GET('/api/admin/announcements'))
  });
}

export function useSaveAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ input, id }: {input: AnnouncementInput;id?: string;}) =>
    unwrap(
      id ?
      await client.PUT('/api/admin/announcements/{aid}', { params: { path: { aid: id } }, body: input }) :
      await client.POST('/api/admin/announcements', { body: input })
    ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.announcements })
  });
}

export function useDeleteAnnouncement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await client.DELETE('/api/admin/announcements/{aid}', { params: { path: { aid: id } } });
      if (!res.response.ok) unwrap(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.announcements })
  });
}

// ── Support tickets ─────────────────────────────────────

export type ApiTicket = components['schemas']['TicketOut'];
export type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

export function useTickets() {
  return useQuery({
    queryKey: ADMIN_KEYS.tickets,
    enabled: useIsAdmin(),
    queryFn: async () => unwrap(await client.GET('/api/admin/tickets'))
  });
}

export function useSetTicketStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: {id: string;status: TicketStatus;}) =>
    unwrap(await client.PUT('/api/admin/tickets/{tid}/status', { params: { path: { tid: id } }, body: { status } })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.tickets })
  });
}

// ── Settings ────────────────────────────────────────────

export interface AdminSettingsData {
  stored: Record<string, Record<string, unknown>>;
  runtime: {
    demoMode: boolean;
    jwtExpireMinutes: number;
    workerThreads: number;
    requireDistinctApprover: boolean;
    whatIfRuns: number;
  };
  note: string;
}

export function useAdminSettings() {
  return useQuery({
    queryKey: ADMIN_KEYS.settings,
    enabled: useIsAdmin(),
    queryFn: () => api.get<AdminSettingsData>('/admin/settings')
  });
}

export function useSaveSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: {key: string;value: Record<string, unknown>;}) => api.put(`/admin/settings/${encodeURIComponent(key)}`, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.settings });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

// ── Reference districts (names from the real boundary file) ──

export function useDistrictNames() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['geographic', 'district-names'],
    enabled: status === 'authenticated',
    staleTime: Infinity,
    queryFn: async () => {
      const fc = await api.get<{features: {properties: {name: string;};}[];}>('/geographic/districts');
      return fc.features.map((f) => f.properties.name).sort((a, b) => a.localeCompare(b));
    }
  });
}
