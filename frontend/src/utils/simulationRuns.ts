import { Range, RunStatus } from '../types/simulationRuns';

export const HORIZON_CHOICES = [30, 60, 90, 180];

export const STATUS_LABELS: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export const isActive = (s: RunStatus) => s === 'queued' || s === 'running';

export function formatDuration(sec: number) {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

export function formatStarted(iso: string) {
  const d = new Date(iso);
  const date = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return `${date}, ${time}`;
}

export const formatCount = (n: number) => n.toLocaleString('en-US');

export interface FormErrors {
  horizon?: string;
  initial?: string;
}

export function validateRunForm(horizon: string, initial: string): FormErrors {
  const errors: FormErrors = {};
  const h = Number(horizon);
  if (!horizon.trim()) errors.horizon = 'Enter how many days to simulate.';else
  if (!Number.isInteger(h)) errors.horizon = 'Use a whole number of days.';else
  if (h < 1 || h > 365) errors.horizon = 'Choose between 1 and 365 days.';
  const n = Number(initial);
  if (!initial.trim()) errors.initial = 'Enter at least 1 infectious case.';else
  if (!Number.isInteger(n)) errors.initial = 'Use a whole number of people.';else
  if (n < 1) errors.initial = 'At least 1 person must be infectious at day 0.';
  return errors;
}
/** "120 (40–310)": median with the 5–95% range across runs. */
export function formatRange(r: Range | null | undefined, fmt: (n: number) => string = (n) => formatCount(Math.round(n))) {
  if (!r) return '—';
  return `${fmt(r.median)} (${fmt(r.low)}–${fmt(r.high)})`;
}

export const formatPct = (v: number | null | undefined, digits = 0) => v == null ? '—' : `${(v * 100).toFixed(digits)}%`;

export const MODEL_LABELS = { seihfr: 'National SEIHFR', seihfr_geo: 'Geographic (30 districts)' } as const;
