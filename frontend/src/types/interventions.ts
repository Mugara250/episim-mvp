/** rate = scales the transmission rate while active; shift = moves people from Susceptible to Recovered. */
export type EffectMechanism = 'rate' | 'shift';

export interface InterventionType {
  id: string;
  key: string;
  name: string;
  description: string;
  builtIn: boolean;
  /** Sample values for design only, not sourced evidence. */
  placeholder: boolean;
  mechanism: EffectMechanism;
  /** 0 to 1 */
  defaultEffect: number;
  source: string;
}

export interface PackageItem {
  id: string;
  typeId: string;
  startDay: number;
  /** null = ongoing until the end of the simulation */
  endDay: number | null;
  /** 0 to 1 */
  coverage: number;
  /** null = use the type's default effect size */
  customEffect: number | null;
}

export interface InterventionPackage {
  id: string;
  name: string;
  description: string;
  items: PackageItem[];
  updated: string;
}

export interface TypeDraft {
  name: string;
  key: string;
  mechanism: EffectMechanism;
  defaultEffect: string;
  source: string;
}

export type TypeFilter = 'all' | 'builtin' | 'custom';