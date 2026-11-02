import { DiseasePreset, TransmissionRoute } from '../types/presets';

export const ROUTE_LABELS: Record<TransmissionRoute, string> = {
  contact: 'Direct contact',
  airborne: 'Airborne',
  waterborne: 'Waterborne',
  vector: 'Vector-borne'
};

export const ROUTE_HELP: Record<TransmissionRoute, string> = {
  contact: 'Spreads through blood, body fluids or contaminated objects',
  airborne: 'Spreads through droplets or particles in the air',
  waterborne: 'Spreads through contaminated water or food',
  vector: 'Spreads through mosquitoes, ticks or other carriers'
};

// All values below are illustrative placeholders for design review, not sourced evidence.
export const diseasePresets: DiseasePreset[] = [
{
  id: 'ebola-zaire',
  name: 'Ebola (Zaire)',
  description: 'Reference values for Zaire ebolavirus in a community setting.',
  builtIn: true,
  placeholder: true,
  r0: 1.8,
  incubationDays: 9,
  infectiousDays: 10,
  mortality: 0.5,
  asymptomatic: 0.1,
  route: 'contact',
  source: 'Placeholder. Replace with pooled estimates, e.g. WHO Ebola Response Team, NEJM 2014 (West Africa).',
  updated: '12 Sep 2026'
},
{
  id: 'marburg',
  name: 'Marburg',
  description: 'Reference values for Marburg virus disease.',
  builtIn: true,
  placeholder: true,
  r0: 1.6,
  incubationDays: 7,
  infectiousDays: 9,
  mortality: 0.5,
  asymptomatic: 0.05,
  route: 'contact',
  source: 'Placeholder. Replace with values from published Marburg outbreak reviews.',
  updated: '12 Sep 2026'
},
{
  id: 'marburg-rw-2024',
  name: 'Marburg - Rwanda 2024 calibration',
  description: 'Custom copy of Marburg, adjusted to the 2024 Rwanda outbreak.',
  builtIn: false,
  placeholder: true,
  r0: 1.4,
  incubationDays: 7.5,
  infectiousDays: 8,
  mortality: 0.227,
  asymptomatic: 0.05,
  route: 'contact',
  source:
  'RBC / Ministry of Health situation reports, Rwanda 2024: 66 cases, 15 deaths (22.7%). Other values are placeholders borrowed from the Marburg reference preset.',
  updated: '30 Sep 2026'
}];