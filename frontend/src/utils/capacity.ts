import { CapacityDraft, CapacityErrors, CapacityProfile } from '../types/capacity';

export const toCapacityDraft = (p: CapacityProfile): CapacityDraft => ({
  name: p.name,
  institutionId: p.institutionId,
  hospitalBeds: String(p.hospitalBeds),
  icuBeds: String(p.icuBeds),
  ventilators: String(p.ventilators),
  healthWorkers: String(p.healthWorkers),
  testsPerDay: String(p.testsPerDay),
  vaccineDoses: p.vaccineDoses === null ? '' : String(p.vaccineDoses),
  sourceNote: p.sourceNote
});

export const blankCapacityDraft = (institutionId: string): CapacityDraft => ({
  name: '',
  institutionId,
  hospitalBeds: '',
  icuBeds: '',
  ventilators: '',
  healthWorkers: '',
  testsPerDay: '',
  vaccineDoses: '',
  sourceNote: ''
});

export const sameCapacityDraft = (a: CapacityDraft, b: CapacityDraft) =>
(Object.keys(a) as (keyof CapacityDraft)[]).every((k) => a[k].trim() === b[k].trim());

/** Parses a whole number, allowing thousands separators. Returns NaN when invalid. */
export function parseWhole(v: string) {
  const s = v.trim().replace(/[,\s]/g, '');
  if (!/^-?\d+$/.test(s)) return NaN;
  return Number(s);
}

const REQUIRED_NUMBERS: {key: keyof CapacityDraft;label: string;}[] = [
{ key: 'hospitalBeds', label: 'hospital beds' },
{ key: 'icuBeds', label: 'ICU beds' },
{ key: 'ventilators', label: 'ventilators' },
{ key: 'healthWorkers', label: 'healthcare workers' },
{ key: 'testsPerDay', label: 'daily testing capacity' }];


export function validateCapacity(d: CapacityDraft, profiles: CapacityProfile[], selfId: string | null): CapacityErrors {
  const e: CapacityErrors = {};
  const name = d.name.trim();
  if (!name) e.name = 'Give the profile a name, e.g. “Kigali Region - 2026”.';else
  if (profiles.some((p) => p.id !== selfId && p.name.toLowerCase() === name.toLowerCase())) e.name = 'Another profile already has this name.';
  if (!d.institutionId) e.institutionId = 'Choose an institution or region.';

  for (const { key, label } of REQUIRED_NUMBERS) {
    const raw = d[key];
    const n = parseWhole(raw);
    if (!raw.trim()) e[key] = `Enter the number of ${label}. Use 0 if there are none.`;else
    if (Number.isNaN(n)) e[key] = 'Enter a whole number, without decimals.';else
    if (n < 0) e[key] = 'This can’t be negative.';
  }
  if (d.vaccineDoses.trim()) {
    const n = parseWhole(d.vaccineDoses);
    if (Number.isNaN(n)) e.vaccineDoses = 'Enter a whole number of doses, or leave it blank.';else
    if (n < 0) e.vaccineDoses = 'This can’t be negative.';
  }
  const beds = parseWhole(d.hospitalBeds);
  const icu = parseWhole(d.icuBeds);
  if (!e.icuBeds && !e.hospitalBeds && icu > beds) e.icuBeds = `ICU beds can’t be more than hospital beds (${beds.toLocaleString('en-US')}).`;
  return e;
}

export const fmt = (n: number | null) => n === null || Number.isNaN(n) ? '—' : n.toLocaleString('en-US');

export const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });