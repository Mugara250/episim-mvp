import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { client, unwrap } from './client';
import { api, ApiError } from './http';
import { ADMIN_KEYS, useIsAdmin } from './admin';
import type { components } from './schema';
import type { Role } from '../lib/rbac';
import type { AccountRequest, AccountRequestInput, AccountRequestStatus } from '../types/accountRequests';

// Account requests (docs D11): anyone may request an account; an administrator approves it and
// assigns the role. Approval creates the user with the password the requester chose.

type AccessRequestOut = components['schemas']['AccessRequestOut'];

/** Public status shape (GET /api/access-requests/status). */
interface RequestStatusOut {
  id: string;
  name: string;
  email: string;
  status: AccountRequestStatus;
  submittedAt: string;
  decidedAt?: string | null;
  assignedRole?: string | null;
  rejectionReason?: string | null;
}

const toRequest = (r: AccessRequestOut): AccountRequest => ({
  id: r.id,
  name: r.name,
  email: r.email,
  institution: r.institution,
  institutionAccountId: r.institutionAccountId,
  position: r.position,
  status: r.status as AccountRequestStatus,
  submittedAt: r.submittedAt,
  decidedAt: r.decidedAt ?? undefined,
  decidedBy: r.decidedBy ?? undefined,
  assignedRole: (r.assignedRole ?? undefined) as Role | undefined,
  rejectionReason: r.rejectionReason ?? undefined,
  seenByAdmin: r.seenByAdmin,
  illustrative: r.illustrative
});

export function useAccessRequests() {
  return useQuery({
    queryKey: ADMIN_KEYS.requests,
    enabled: useIsAdmin(),
    refetchInterval: 30_000,
    queryFn: async () => unwrap(await client.GET('/api/admin/access-requests')).map(toRequest)
  });
}

/** Looks up the latest request for an email. Resolves undefined when there is none. */
export async function fetchRequestStatus(email: string): Promise<RequestStatusOut | undefined> {
  try {
    return await api.get<RequestStatusOut>('/access-requests/status', { query: { email: email.trim().toLowerCase() } });
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return undefined;
    throw e;
  }
}

/** Polls the status of the request submitted from this browser. */
export function useRequestStatus(email: string | undefined) {
  return useQuery({
    queryKey: ['access-request-status', email],
    enabled: !!email,
    refetchInterval: 20_000,
    queryFn: () => fetchRequestStatus(email as string)
  });
}

export function mergeStatus(base: Omit<AccountRequest, 'status' | 'seenByAdmin'> & Partial<AccountRequest>, s?: RequestStatusOut): AccountRequest {
  return {
    seenByAdmin: false,
    ...base,
    status: s?.status ?? base.status ?? 'Pending',
    decidedAt: s?.decidedAt ?? undefined,
    assignedRole: (s?.assignedRole ?? undefined) as Role | undefined,
    rejectionReason: s?.rejectionReason ?? undefined
  };
}

export function useSubmitRequest() {
  return useMutation({
    mutationFn: async (input: AccountRequestInput) =>
    unwrap(
      await client.POST('/api/access-requests', {
        body: { ...input, email: input.email.trim(), name: input.name.trim() }
      })
    )
  });
}

export function useApproveRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role, institutionId }: {id: string;role: Role;institutionId?: string;}) =>
    unwrap(
      await client.POST('/api/admin/access-requests/{rid}/approve', {
        params: { path: { rid: id } },
        body: { role, institutionId: institutionId ?? null }
      })
    ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.requests });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.users });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

export function useRejectRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, reason }: {id: string;reason: string;}) =>
    unwrap(await client.POST('/api/admin/access-requests/{rid}/reject', { params: { path: { rid: id } }, body: { reason } })),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.requests });
      qc.invalidateQueries({ queryKey: ADMIN_KEYS.audit });
    }
  });
}

export function useMarkRequestsSeen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await client.POST('/api/admin/access-requests/mark-seen');
      if (!res.response.ok) unwrap(res);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ADMIN_KEYS.requests })
  });
}
