import { HospitalEntry, OfficerDisease } from '../types/officer';

export const OCCUPANCY_WARNING = 0.8;

export function formatDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function sortByDate(entries: HospitalEntry[]) {
  return [...entries].sort((a, b) => a.date.localeCompare(b.date));
}

export function latestFor(entries: HospitalEntry[], disease: OfficerDisease) {
  return sortByDate(entries.filter((e) => e.disease === disease)).pop();
}

/** Most recent hospital-wide bed figures, whichever disease the entry was for. */
export function latestBeds(entries: HospitalEntry[]) {
  const last = sortByDate(entries).pop();
  return last ? { occupied: last.bedsOccupied, total: last.bedsTotal, date: last.date } : null;
}

/** One bed reading per day (latest entry wins). */
export function dailyOccupancy(entries: HospitalEntry[]) {
  const byDay = new Map<string, HospitalEntry>();
  sortByDate(entries).forEach((e) => byDay.set(e.date, e));
  return Array.from(byDay.values()).map((e) => ({ date: e.date, occupied: e.bedsOccupied, total: e.bedsTotal }));
}

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  const pad = (v: number) => String(v).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}