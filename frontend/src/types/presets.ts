export type TransmissionRoute = 'airborne' | 'waterborne' | 'contact' | 'vector';

/**
 * @deprecated Generic prototype preset (R0, incubation, infectious days, mortality). Superseded by the
 * SEIHFR preset from the API (`Preset` in src/api/presets.ts, docs D15). Kept only until the remaining
 * prototype screens stop importing it.
 */
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

/** Numeric SEIHFR preset fields, as named by the API (camelCase). */
export type PresetNumberKey =
'r0Low' |
'r0Likely' |
'r0High' |
'overdispersionK' |
'incubationDays' |
'onsetToAdmissionDays' |
'onsetToDeathDays' |
'onsetToRecoveryDays' |
'cfrCommunity' |
'cfrHospital' |
'shareHospitalised' |
'burialDelayDays' |
'hcwRisk' |
'serialIntervalMean' |
'serialIntervalSd' |
'routeShareCommunity' |
'routeShareHospital' |
'routeShareFuneral' |
'baselineSafeBurial' |
'baselineContactTracing' |
'baselineIsolation' |
'defaultInitialCases' |
'hcwPpeBefore' |
'hcwPpeAfter' |
'hcwRecognitionDay';

/** Form values are kept as text so half-typed numbers can be validated inline. */
export type PresetDraft = Record<PresetNumberKey, string> & {
  name: string;
  /** Disease family, e.g. ebola or marburg. Set when creating; fixed afterwards. */
  disease: string;
  virus: string;
  description: string;
  color: string;
  provisional: boolean;
  reference: string;
};

export type PresetErrors = Partial<Record<keyof PresetDraft | 'routeShares' | 'r0Range', string>>;

export type PresetFilter = 'all' | 'builtin' | 'custom';

export interface PresetToast {
  id: number;
  tone: 'loading' | 'success' | 'error' | 'info';
  text: string;
}
