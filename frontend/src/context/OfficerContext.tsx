import { ReactNode } from 'react';
import {
  EntryCounts,
  PlanInput,
  useDeletePlan,
  useHospitalEntries,
  useInstructions,
  useOwnHospital,
  usePlans,
  useSaveEntry,
  useSavePlan,
  useSetInstructionStatus } from
'../api/officer';
import { InstructionStatus, OfficerDisease } from '../types/officer';

// Officer data now lives in the database (Module 17). The provider is kept so the app shell
// doesn't change; useOfficer composes the TanStack Query hooks, which share one cache.

export function OfficerProvider({ children }: {children: ReactNode;}) {
  return <>{children}</>;
}

export function useOfficer() {
  const hospital = useOwnHospital();
  const entries = useHospitalEntries();
  const instructions = useInstructions();
  const plans = usePlans();
  const saveEntryM = useSaveEntry();
  const statusM = useSetInstructionStatus();
  const savePlanM = useSavePlan();
  const deletePlanM = useDeletePlan();

  const queries = [hospital, entries, instructions, plans];
  return {
    hospital: hospital.data,
    entries: entries.data ?? [],
    instructions: instructions.data ?? [],
    plans: plans.data ?? [],
    isLoading: queries.some((q) => q.isLoading),
    error: queries.find((q) => q.error)?.error as Error | undefined,
    saveEntry: (date: string, disease: OfficerDisease, counts: EntryCounts) => saveEntryM.mutateAsync({ date, disease, counts }),
    setInstructionStatus: (id: string, status: InstructionStatus, reason?: string) =>
    statusM.mutateAsync({ id, status, reason }),
    savePlan: (plan: PlanInput, id?: string) => savePlanM.mutateAsync({ plan, id }),
    deletePlan: (id: string) => deletePlanM.mutateAsync(id),
    saving: saveEntryM.isPending || statusM.isPending || savePlanM.isPending || deletePlanM.isPending
  };
}
