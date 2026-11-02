export type InstitutionKind = 'Region' | 'District hospital catchment' | 'Referral hospital';

export interface Institution {
  id: string;
  name: string;
  kind: InstitutionKind;
}

export interface CapacityProfile {
  id: string;
  name: string;
  institutionId: string;
  hospitalBeds: number;
  icuBeds: number;
  ventilators: number;
  healthWorkers: number;
  testsPerDay: number;
  /** null = not applicable */
  vaccineDoses: number | null;
  sourceNote: string;
  updated: string;
  updatedBy: string;
  /** Sample values for design review only. */
  placeholder: boolean;
}

/** A saved scenario comparison whose capacity warnings are checked against a profile. */
export interface ProfileComparison {
  id: string;
  name: string;
  runs: number;
  date: string;
  profileId: string;
}

export type NumberField = 'hospitalBeds' | 'icuBeds' | 'ventilators' | 'healthWorkers' | 'testsPerDay' | 'vaccineDoses';

export interface CapacityDraft {
  name: string;
  institutionId: string;
  hospitalBeds: string;
  icuBeds: string;
  ventilators: string;
  healthWorkers: string;
  testsPerDay: string;
  vaccineDoses: string;
  sourceNote: string;
}

export type CapacityErrors = Partial<Record<keyof CapacityDraft, string>>;