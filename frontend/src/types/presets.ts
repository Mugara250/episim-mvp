export type TransmissionRoute = 'airborne' | 'waterborne' | 'contact' | 'vector';

export interface DiseasePreset {
  id: string;
  name: string;
  description: string;
  builtIn: boolean;
  /** Sample values for design only, not sourced evidence. */
  placeholder: boolean;
  r0: number;
  incubationDays: number;
  infectiousDays: number;
  mortality: number;
  asymptomatic: number;
  route: TransmissionRoute;
  source: string;
  updated: string;
}

/** Form values are kept as text so half-typed numbers can be validated inline. */
export interface PresetDraft {
  name: string;
  r0: string;
  incubationDays: string;
  infectiousDays: string;
  mortality: string;
  asymptomatic: string;
  route: TransmissionRoute;
  source: string;
}

export type PresetErrors = Partial<Record<keyof PresetDraft, string>>;

export type PresetFilter = 'all' | 'builtin' | 'custom';

export interface PresetToast {
  id: number;
  tone: 'loading' | 'success' | 'error' | 'info';
  text: string;
}