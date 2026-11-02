// The only two diseases in EpiSim: Ebola (Zaire) and Marburg.
// Delays are in days. Rates are fractions (0–1).

export type DiseaseId = 'ebola' | 'marburg';

export interface DiseaseProfile {
  id: DiseaseId;
  name: string;
  virus: string;
  color: string;
  r0: {low: number;likely: number;high: number;};
  /** Overdispersion: small values mean a few people cause most infections. */
  k: number;
  incubation: number;
  onsetToAdmission: number;
  onsetToDeath: number;
  onsetToRecovery: number;
  cfrCommunity: number;
  cfrHospital: number;
  /** Share of cases that reach a hospital or treatment centre. */
  hospitalised: number;
  burialDelay: number;
  /** Expected health-worker infections per hospitalised patient-day with no protection. */
  hcwRisk: number;
  serialInterval: {mean: number;sd: number;};
  provisional: boolean;
  reference: string;
}

export const DISEASES: DiseaseProfile[] = [
{
  id: 'ebola',
  name: 'Ebola',
  virus: 'Zaire ebolavirus',
  color: '#EF4444',
  r0: { low: 1.2, likely: 1.8, high: 2.7 },
  k: 0.18,
  incubation: 8.5,
  onsetToAdmission: 4.5,
  onsetToDeath: 9.3,
  onsetToRecovery: 13.0,
  cfrCommunity: 0.646,
  cfrHospital: 0.5,
  hospitalised: 0.6,
  burialDelay: 2,
  hcwRisk: 0.08,
  serialInterval: { mean: 15.4, sd: 9.3 },
  provisional: false,
  reference: 'Systematic review of Ebola outbreaks (West Africa 2013–16, DRC 2018–20).'
},
{
  id: 'marburg',
  name: 'Marburg',
  virus: 'Marburg marburgvirus',
  color: '#F59E0B',
  r0: { low: 1.2, likely: 1.6, high: 2.0 },
  k: 0.3,
  incubation: 7,
  onsetToAdmission: 4,
  onsetToDeath: 8,
  onsetToRecovery: 15,
  cfrCommunity: 0.5,
  cfrHospital: 0.227,
  hospitalised: 0.8,
  burialDelay: 2,
  hcwRisk: 0.25,
  serialInterval: { mean: 9, sd: 5 },
  provisional: true,
  reference: 'Rwanda 2024: 66 cases, 15 deaths (22.7%), about 80% health workers. Other values provisional.'
}];


export function getDisease(id: DiseaseId) {
  return DISEASES.find((d) => d.id === id) ?? DISEASES[0];
}