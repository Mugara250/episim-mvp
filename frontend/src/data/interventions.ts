import { EffectMechanism, InterventionPackage, InterventionType } from '../types/interventions';

export const MECHANISM_LABELS: Record<EffectMechanism, string> = {
  rate: 'Rate multiplier',
  shift: 'Compartment shift'
};

export const MECHANISM_HELP: Record<EffectMechanism, string> = {
  rate: 'Lowers how easily the disease spreads while the intervention is active. Example: lockdown, masking, testing, contact tracing.',
  shift: 'Moves people straight from “can catch it” (Susceptible) to “protected” (Recovered). Example: vaccination.'
};

// All effect sizes below are illustrative placeholders for design review, not sourced evidence.
export const interventionTypes: InterventionType[] = [
{
  id: 'contact-tracing',
  key: 'contact_tracing',
  name: 'Contact tracing',
  description: 'Finding and following up people who were near a confirmed case.',
  builtIn: true,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.35,
  source: 'Placeholder. Replace with an evidence review of contact tracing effectiveness for filovirus outbreaks.'
},
{
  id: 'lockdown',
  key: 'lockdown',
  name: 'Lockdown',
  description: 'Restricting movement and gatherings in an area.',
  builtIn: true,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.5,
  source: 'Placeholder. Replace with estimates from published movement-restriction studies.'
},
{
  id: 'masking',
  key: 'masking',
  name: 'Masking',
  description: 'Wearing masks in health facilities and crowded places.',
  builtIn: true,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.15,
  source: 'Placeholder. Replace with estimates relevant to the disease being modelled.'
},
{
  id: 'testing',
  key: 'testing',
  name: 'Testing',
  description: 'Testing suspected cases quickly so they can be isolated sooner.',
  builtIn: true,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.2,
  source: 'Placeholder. Replace with estimates of the effect of faster diagnosis.'
},
{
  id: 'vaccination',
  key: 'vaccination',
  name: 'Vaccination',
  description: 'Vaccinating people so they can no longer catch the disease.',
  builtIn: true,
  placeholder: true,
  mechanism: 'shift',
  defaultEffect: 0.9,
  source: 'Placeholder. For Ebola (Zaire), replace with rVSV-ZEBOV ring vaccination trial estimates. No licensed Marburg vaccine.'
},
{
  id: 'safe-burials',
  key: 'safe_burials',
  name: 'Safe and dignified burials',
  description: 'Trained teams handle burials to avoid infection at funerals.',
  builtIn: false,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.3,
  source: 'Placeholder. Based on the share of transmission linked to funerals in past outbreaks; replace with a cited estimate.'
},
{
  id: 'case-isolation',
  key: 'case_isolation',
  name: 'Case isolation',
  description: 'Moving confirmed cases into isolation wards.',
  builtIn: false,
  placeholder: true,
  mechanism: 'rate',
  defaultEffect: 0.45,
  source: ''
}];


export const interventionPackages: InterventionPackage[] = [
{
  id: 'pkg-lockdown-masking',
  name: 'Partial lockdown + masking',
  description: 'A three-week lockdown with ongoing masking in health facilities.',
  updated: '28 Sep 2026',
  items: [
  { id: 'i1', typeId: 'lockdown', startDay: 14, endDay: 35, coverage: 0.6, customEffect: null },
  { id: 'i2', typeId: 'masking', startDay: 7, endDay: null, coverage: 0.7, customEffect: null }]

},
{
  id: 'pkg-tracing-isolation',
  name: 'Contact tracing + isolation',
  description: 'Find contacts early and isolate confirmed cases, backed by faster testing.',
  updated: '04 Oct 2026',
  items: [
  { id: 'i3', typeId: 'contact-tracing', startDay: 3, endDay: null, coverage: 0.8, customEffect: null },
  { id: 'i4', typeId: 'case-isolation', startDay: 5, endDay: null, coverage: 0.75, customEffect: 0.5 },
  { id: 'i5', typeId: 'testing', startDay: 3, endDay: 60, coverage: 0.65, customEffect: null }]

},
{
  id: 'pkg-tracing-burials',
  name: 'Contact tracing + safe burials',
  description: 'Follow up contacts from day 2 and send trained burial teams for every death.',
  updated: '07 Oct 2026',
  items: [
  { id: 'i8', typeId: 'contact-tracing', startDay: 2, endDay: null, coverage: 0.75, customEffect: null },
  { id: 'i9', typeId: 'safe-burials', startDay: 4, endDay: null, coverage: 0.9, customEffect: 0.6 }]

},
{
  id: 'pkg-ring-vaccination',
  name: 'Ebola ring vaccination',
  description: 'Ring vaccination of contacts with safe burials throughout.',
  updated: '06 Oct 2026',
  items: [
  { id: 'i6', typeId: 'vaccination', startDay: 10, endDay: 70, coverage: 0.4, customEffect: null },
  { id: 'i7', typeId: 'safe-burials', startDay: 0, endDay: null, coverage: 0.85, customEffect: null }]

}];