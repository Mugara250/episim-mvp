import { ReactNode } from 'react';
import {
  HospitalInput,
  UserInput,
  useAdminHospitals,
  useAdminUsers,
  useInstitutions,
  useSaveHospital,
  useSaveUser,
  useSetUserStatus } from
'../api/admin';
import { AdminUser } from '../types/admin';

// Admin data lives in the database (Module 14). The provider is kept so the app shell doesn't
// change; useAdmin composes TanStack Query hooks that share one cache.

export function AdminProvider({ children }: {children: ReactNode;}) {
  return <>{children}</>;
}

export function useAdmin() {
  const usersQ = useAdminUsers();
  const hospitalsQ = useAdminHospitals();
  const institutionsQ = useInstitutions();
  const saveUserM = useSaveUser();
  const statusM = useSetUserStatus();
  const saveHospitalM = useSaveHospital();

  const users = usersQ.data ?? [];
  const hospitals = hospitalsQ.data ?? [];
  const hospitalIds = new Set(hospitals.map((h) => h.id));
  /** Non-hospital organisations a user can belong to. */
  const organisations = (institutionsQ.data ?? []).filter((i) => !hospitalIds.has(i.id) && !/hospital/i.test(i.kind));

  const hospitalName = (id?: string) => hospitals.find((h) => h.id === id)?.name ?? '—';
  const officersAt = (hospitalId: string) => users.filter((u) => u.role === 'officer' && u.hospitalId === hospitalId);

  const saveUser = (input: UserInput, id?: string) => saveUserM.mutateAsync({ input, id });

  const toggleStatus = (id: string) => {
    const u = users.find((x) => x.id === id);
    if (!u) return Promise.resolve(undefined);
    return statusM.mutateAsync({ id, status: u.status === 'Active' ? 'Inactive' : 'Active' });
  };

  /** Saves the hospital, then (optionally) assigns an officer to it. */
  const saveHospital = async (input: HospitalInput, officerId: string, id?: string) => {
    const saved = await saveHospitalM.mutateAsync({ input, id });
    const officer = officerId ? users.find((u) => u.id === officerId) : undefined;
    if (officer && officer.hospitalId !== saved.id) {
      await saveUserM.mutateAsync({ id: officer.id, input: toInput(officer, { institutionId: saved.id }) });
    }
    return saved;
  };

  return {
    users,
    hospitals,
    organisations,
    isLoading: usersQ.isLoading || hospitalsQ.isLoading,
    error: (usersQ.error ?? hospitalsQ.error) as Error | null,
    saveUser,
    toggleStatus,
    saveHospital,
    officersAt,
    hospitalName,
    saving: saveUserM.isPending || statusM.isPending || saveHospitalM.isPending
  };
}

/** Rebuilds the full user body the server expects from a listed user. */
export function toInput(u: AdminUser, patch: Partial<UserInput> = {}): UserInput {
  return {
    name: u.name,
    email: u.email,
    role: u.role,
    institutionId: u.institutionId,
    status: u.status,
    canEditBuiltins: u.canEditBuiltins,
    ...patch
  };
}
