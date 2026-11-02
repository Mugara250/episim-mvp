import { DiseasePreset, PresetDraft, PresetErrors } from '../types/presets';

export const toDraft = (p: DiseasePreset): PresetDraft => ({
  name: p.name,
  r0: String(p.r0),
  incubationDays: String(p.incubationDays),
  infectiousDays: String(p.infectiousDays),
  mortality: String(p.mortality),
  asymptomatic: String(p.asymptomatic),
  route: p.route,
  source: p.source
});

export const BLANK_DRAFT: PresetDraft = {
  name: '',
  r0: '',
  incubationDays: '',
  infectiousDays: '',
  mortality: '',
  asymptomatic: '',
  route: 'contact',
  source: ''
};

export const sameDraft = (a: PresetDraft, b: PresetDraft) =>
(Object.keys(a) as (keyof PresetDraft)[]).every((k) => String(a[k]).trim() === String(b[k]).trim());

function checkNumber(raw: string, label: string, opts: {min: number;max: number;minInclusive?: boolean;unit?: string;}) {
  const v = raw.trim();
  if (!v) return `Enter the ${label}.`;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label[0].toUpperCase() + label.slice(1)} must be a number.`;
  if (n < 0) return `${label[0].toUpperCase() + label.slice(1)} can’t be negative.`;
  if (opts.minInclusive ? n < opts.min : n <= opts.min) return `${label[0].toUpperCase() + label.slice(1)} must be more than ${opts.min}${opts.unit ?? ''}.`;
  if (n > opts.max) return `${label[0].toUpperCase() + label.slice(1)} must be ${opts.max}${opts.unit ?? ''} or less.`;
  return '';
}

function checkFraction(raw: string, label: string) {
  const v = raw.trim();
  if (!v) return `Enter the ${label}.`;
  const n = Number(v);
  if (!Number.isFinite(n)) return `${label[0].toUpperCase() + label.slice(1)} must be a number between 0 and 1.`;
  if (n < 0 || n > 1)
  return `${label[0].toUpperCase() + label.slice(1)} must be between 0 and 1. For ${n > 1 && n <= 100 ? `${n}%, enter ${(n / 100).toString()}` : 'a percentage, divide by 100'}.`;
  return '';
}

export function validateDraft(d: PresetDraft, presets: DiseasePreset[], selfId: string | null): PresetErrors {
  const errors: PresetErrors = {};
  const name = d.name.trim();
  if (!name) errors.name = 'Give the preset a name.';else
  if (presets.some((p) => p.id !== selfId && p.name.trim().toLowerCase() === name.toLowerCase()))
  errors.name = 'Another preset already has this name.';
  const set = (k: keyof PresetDraft, msg: string) => {
    if (msg) errors[k] = msg;
  };
  set('r0', checkNumber(d.r0, 'R0', { min: 0, max: 30 }));
  set('incubationDays', checkNumber(d.incubationDays, 'incubation period', { min: 0, max: 60, unit: ' days' }));
  set('infectiousDays', checkNumber(d.infectiousDays, 'infectious period', { min: 0, max: 120, unit: ' days' }));
  set('mortality', checkFraction(d.mortality, 'mortality rate'));
  set('asymptomatic', checkFraction(d.asymptomatic, 'asymptomatic fraction'));
  return errors;
}

export const fromDraft = (d: PresetDraft) => ({
  name: d.name.trim(),
  r0: Number(d.r0),
  incubationDays: Number(d.incubationDays),
  infectiousDays: Number(d.infectiousDays),
  mortality: Number(d.mortality),
  asymptomatic: Number(d.asymptomatic),
  route: d.route,
  source: d.source.trim()
});

export function asPercent(raw: string | number) {
  const n = Number(raw);
  if (raw === '' || !Number.isFinite(n) || n < 0 || n > 1) return null;
  const pct = n * 100;
  return `${pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct * 10) / 10}%`;
}

export function uniqueName(base: string, presets: DiseasePreset[]) {
  const taken = new Set(presets.map((p) => p.name.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  let i = 2;
  while (taken.has(`${base} ${i}`.toLowerCase())) i++;
  return `${base} ${i}`;
}

export const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });