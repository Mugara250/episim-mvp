import type { Preset, PresetFields } from '../api/presets';
import { PresetDraft, PresetErrors, PresetNumberKey } from '../types/presets';

// SEIHFR preset fields (docs Module 4 / Appendix A). Shares and rates are fractions 0 to 1; times are days.

export interface PresetFieldSpec {
  key: PresetNumberKey;
  label: string;
  unit?: string;
  help: string;
  kind: 'fraction' | 'number' | 'whole';
  /** Exclusive lower bound unless minInclusive. */
  min: number;
  max: number;
  minInclusive?: boolean;
}

export interface PresetFieldGroup {
  title: string;
  intro: string;
  fields: PresetFieldSpec[];
}

export const PRESET_GROUPS: PresetFieldGroup[] = [
{
  title: 'Transmission',
  intro: 'How many people one case infects, and how unevenly.',
  fields: [
  { key: 'r0Low', label: 'R0, low', help: 'Lower end of the plausible basic reproduction number.', kind: 'number', min: 0, max: 20, minInclusive: true },
  { key: 'r0Likely', label: 'R0, most likely', help: 'The value runs use by default: average number of people one case infects with no immunity and no response.', kind: 'number', min: 0, max: 20, minInclusive: true },
  { key: 'r0High', label: 'R0, high', help: 'Upper end of the plausible basic reproduction number.', kind: 'number', min: 0, max: 20, minInclusive: true },
  { key: 'overdispersionK', label: 'Overdispersion k', help: 'Small values mean a few people cause most infections (superspreading), so small outbreaks often die out by chance.', kind: 'number', min: 0, max: 100 }]

},
{
  title: 'Timing',
  intro: 'Days between the main events in a case’s illness.',
  fields: [
  { key: 'incubationDays', label: 'Incubation period', unit: 'days', help: 'Days between infection and the first symptoms.', kind: 'number', min: 0, max: 60 },
  { key: 'onsetToAdmissionDays', label: 'Onset to admission', unit: 'days', help: 'Days from first symptoms until a case is admitted, if it is admitted. Also the baseline detection delay.', kind: 'number', min: 0, max: 60 },
  { key: 'onsetToDeathDays', label: 'Onset to death', unit: 'days', help: 'Days from first symptoms to death, for fatal cases.', kind: 'number', min: 0, max: 120 },
  { key: 'onsetToRecoveryDays', label: 'Onset to recovery', unit: 'days', help: 'Days from first symptoms to recovery, for cases that survive.', kind: 'number', min: 0, max: 120 },
  { key: 'burialDelayDays', label: 'Burial delay', unit: 'days', help: 'How long a body stays infectious before burial.', kind: 'number', min: 0, max: 30 },
  { key: 'serialIntervalMean', label: 'Serial interval, mean', unit: 'days', help: 'Average time between one case’s symptoms and the next case’s. Used for Rt tracking.', kind: 'number', min: 0, max: 60 },
  { key: 'serialIntervalSd', label: 'Serial interval, SD', unit: 'days', help: 'Spread (standard deviation) of the serial interval.', kind: 'number', min: 0, max: 60 }]

},
{
  title: 'Severity and care',
  intro: 'Who reaches a facility, and who dies.',
  fields: [
  { key: 'shareHospitalised', label: 'Share hospitalised', unit: '0 to 1', help: 'Share of cases that reach a hospital or treatment centre.', kind: 'fraction', min: 0, max: 1 },
  { key: 'cfrCommunity', label: 'Fatality, not admitted', unit: '0 to 1', help: 'Share of cases who die among those never admitted.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'cfrHospital', label: 'Fatality, admitted', unit: '0 to 1', help: 'Share of admitted cases who die.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'hcwRisk', label: 'Health-worker risk', help: 'Expected health-worker infections per hospitalised patient-day with no protection.', kind: 'number', min: 0, max: 5, minInclusive: true }]

},
{
  title: 'Transmission routes',
  intro: 'Share of R0 carried by each route. Must add up to 100%. Placeholders until an epidemiologist reviews them.',
  fields: [
  { key: 'routeShareCommunity', label: 'Community', unit: '0 to 1', help: 'Share of spread that happens in the community before a case is isolated.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'routeShareHospital', label: 'Hospital', unit: '0 to 1', help: 'Share of spread that happens in health facilities (visitors, other patients).', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'routeShareFuneral', label: 'Funeral', unit: '0 to 1', help: 'Share of spread that happens at unsafe funerals.', kind: 'fraction', min: 0, max: 1, minInclusive: true }]

},
{
  title: 'Current response (baseline)',
  intro: 'The response already in place when a scenario has no intervention package. Placeholders until reviewed.',
  fields: [
  { key: 'baselineSafeBurial', label: 'Safe burial', unit: '0 to 1', help: 'Share of deaths buried safely, removing funeral transmission.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'baselineContactTracing', label: 'Contact tracing', unit: '0 to 1', help: 'Strength of contact tracing; reduces community transmission.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'baselineIsolation', label: 'Isolation', unit: '0 to 1', help: 'Strength of infection control in facilities; reduces hospital transmission.', kind: 'fraction', min: 0, max: 1, minInclusive: true }]

},
{
  title: 'Defaults for new runs',
  intro: 'Pre-filled on the run form; each run can change them.',
  fields: [
  { key: 'defaultInitialCases', label: 'Initial cases', help: 'Infectious people at day 0.', kind: 'whole', min: 1, max: 100000, minInclusive: true },
  { key: 'hcwPpeBefore', label: 'Protection before recognition', unit: '0 to 1', help: 'Protective equipment and infection control used correctly before the outbreak is recognised.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'hcwPpeAfter', label: 'Protection after recognition', unit: '0 to 1', help: 'Same, after the outbreak is recognised.', kind: 'fraction', min: 0, max: 1, minInclusive: true },
  { key: 'hcwRecognitionDay', label: 'Recognition day', help: 'Day the outbreak is recognised and full protection starts.', kind: 'whole', min: 0, max: 365, minInclusive: true }]

}];


export const ALL_FIELDS = PRESET_GROUPS.flatMap((g) => g.fields);
const NUMBER_KEYS = ALL_FIELDS.map((f) => f.key);

export const toDraft = (p: Preset): PresetDraft => {
  const nums = Object.fromEntries(NUMBER_KEYS.map((k) => [k, String(p[k] ?? '')])) as Record<PresetNumberKey, string>;
  return {
    ...nums,
    name: p.name,
    disease: p.disease,
    virus: p.virus ?? '',
    description: p.description ?? '',
    color: p.color ?? '#64748B',
    provisional: !!p.provisional,
    reference: p.reference ?? ''
  };
};

export const BLANK_DRAFT: PresetDraft = {
  ...Object.fromEntries(NUMBER_KEYS.map((k) => [k, ''])) as Record<PresetNumberKey, string>,
  routeShareCommunity: '0.55',
  routeShareHospital: '0.15',
  routeShareFuneral: '0.3',
  baselineSafeBurial: '0.5',
  baselineContactTracing: '0.4',
  baselineIsolation: '0.5',
  defaultInitialCases: '3',
  hcwPpeBefore: '0.3',
  hcwPpeAfter: '0.85',
  hcwRecognitionDay: '14',
  name: '',
  disease: '',
  virus: '',
  description: '',
  color: '#64748B',
  provisional: true,
  reference: ''
};

export const sameDraft = (a: PresetDraft, b: PresetDraft) =>
(Object.keys(a) as (keyof PresetDraft)[]).every((k) => String(a[k]).trim() === String(b[k]).trim());

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

function checkField(raw: string, f: PresetFieldSpec) {
  const v = raw.trim();
  const label = f.label.toLowerCase();
  if (!v) return `Enter the ${label}.`;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${cap(label)} must be a number${f.kind === 'fraction' ? ' between 0 and 1' : ''}.`;
  if (f.kind === 'whole' && !Number.isInteger(n)) return `${cap(label)} must be a whole number.`;
  if (n < 0) return `${cap(label)} can’t be negative.`;
  if (f.kind === 'fraction' && n > 1)
  return `${cap(label)} must be between 0 and 1. For ${n <= 100 ? `${n}%, enter ${(n / 100).toString()}` : 'a percentage, divide by 100'}.`;
  if (f.minInclusive ? n < f.min : n <= f.min) return `${cap(label)} must be more than ${f.min}${f.unit === 'days' ? ' days' : ''}.`;
  if (n > f.max) return `${cap(label)} must be ${f.max}${f.unit === 'days' ? ' days' : ''} or less.`;
  return '';
}

export function validateDraft(d: PresetDraft, presets: Preset[], selfId: string | null, isNew: boolean): PresetErrors {
  const errors: PresetErrors = {};
  const name = d.name.trim();
  if (!name) errors.name = 'Give the preset a name.';else
  if (presets.some((p) => p.id !== selfId && p.name.trim().toLowerCase() === name.toLowerCase()))
  errors.name = 'Another preset already has this name.';
  if (isNew && !/^[a-z0-9_-]{1,40}$/i.test(d.disease.trim())) errors.disease = 'Give the disease family as one word, e.g. ebola.';
  for (const f of ALL_FIELDS) {
    const msg = checkField(d[f.key], f);
    if (msg) errors[f.key] = msg;
  }
  const [lo, li, hi] = [Number(d.r0Low), Number(d.r0Likely), Number(d.r0High)];
  if (!errors.r0Low && !errors.r0Likely && !errors.r0High && !(lo <= li && li <= hi))
  errors.r0Range = 'R0 must go low ≤ most likely ≤ high.';
  const shares = ['routeShareCommunity', 'routeShareHospital', 'routeShareFuneral'] as const;
  if (shares.every((k) => !errors[k])) {
    const total = shares.reduce((s, k) => s + Number(d[k]), 0);
    if (Math.abs(total - 1) > 0.01) errors.routeShares = `The three route shares must add up to 100% (now ${Math.round(total * 100)}%).`;
  }
  return errors;
}

export const fromDraft = (d: PresetDraft): PresetFields => {
  const nums = Object.fromEntries(NUMBER_KEYS.map((k) => [k, Number(d[k])])) as Record<PresetNumberKey, number>;
  return {
    ...nums,
    name: d.name.trim(),
    virus: d.virus.trim(),
    description: d.description.trim(),
    color: d.color,
    provisional: d.provisional,
    reference: d.reference.trim()
  };
};

export function asPercent(raw: string | number | null | undefined) {
  const n = Number(raw);
  if (raw === '' || raw === null || raw === undefined || !Number.isFinite(n) || n < 0 || n > 1) return null;
  const pct = n * 100;
  return `${pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct * 10) / 10}%`;
}

export function uniqueName(base: string, presets: {name: string;}[]) {
  const taken = new Set(presets.map((p) => p.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let i = 2;
  while (taken.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

export const dateLabel = (iso: string | null | undefined) =>
iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

export const todayLabel = () => dateLabel(new Date().toISOString());
