import type { PackageRef, PopulationDataset, PresetRef, Scenario, ScenarioDraft } from '../types/scenarios';

// Lookups take the reference lists from useScenarioRefs() (API data), not sample data.

export const findDataset = (list: PopulationDataset[], id: string | null) => list.find((d) => d.id === id);
export const findPreset = (list: PresetRef[], id: string | null) => list.find((p) => p.id === id);
export const findPackage = (list: PackageRef[], id: string | null) => list.find((p) => p.id === id);

/** "Kigali City 2022 - v1": the scenario carries the dataset name and pinned version. */
export const datasetLabel = (s: Pick<Scenario, 'datasetName' | 'datasetVersion' | 'datasetLatestVersion'>) =>
s.datasetName ? `${s.datasetName} - v${s.datasetVersion ?? s.datasetLatestVersion}` : 'No dataset';

export const packageLabel = (name: string | null | undefined) => name ?? 'No interventions';

export const formatPop = (n: number) => n.toLocaleString('en-US');

export const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

export const PERMISSION_LABELS = { view: 'Can view', clone: 'Can clone' } as const;

export const toDraft = (s: Scenario, name = s.name): ScenarioDraft => ({
  name,
  description: s.description,
  datasetId: s.datasetId,
  presetId: s.presetId,
  packageId: s.packageId,
  visibility: s.visibility === 'institution' ? 'institution' : 'private'
});

export const BLANK_SCENARIO: ScenarioDraft = {
  name: '',
  description: '',
  datasetId: null,
  presetId: null,
  packageId: null,
  visibility: 'private'
};

/** ISO timestamp → "09 Oct 2026". */
export const dateLabel = (iso: string | null | undefined) =>
iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** Length of a package timeline in days (at least 60, rounded up to tens). */
export function timelineLength(items: {startDay: number;endDay?: number | null;}[]) {
  const last = items.reduce((m, i) => Math.max(m, i.endDay ?? i.startDay + 14, i.startDay), 0);
  return Math.max(60, Math.ceil((last + 10) / 10) * 10);
}
