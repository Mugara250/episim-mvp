import { interventionTypes } from '../data/interventions';
import { RunStatus, RunSummary } from '../types/simulationRuns';
import { Scenario } from '../types/scenarios';
import { findDataset, findPackage, findPreset } from './scenarios';
import { runSeihfr } from './seihfr';

export const HORIZON_CHOICES = [30, 60, 90, 180];

export const STATUS_LABELS: Record<RunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export const isActive = (s: RunStatus) => s === 'queued' || s === 'running';

/** Summary tiles for a run. Returns null if the scenario's dataset or disease no longer exists. */
export function summarize(scenario: Scenario | undefined, horizonDays: number, initialCases: number): RunSummary | null {
  const dataset = findDataset(scenario?.datasetId ?? null);
  const preset = findPreset(scenario?.presetId ?? null);
  if (!scenario || !dataset || !preset) return null;
  return runSeihfr({
    population: dataset.population,
    preset,
    pkg: findPackage(scenario.packageId),
    types: interventionTypes,
    horizonDays,
    initialCases
  });
}

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