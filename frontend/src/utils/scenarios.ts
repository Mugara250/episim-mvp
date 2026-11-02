import { diseasePresets } from '../data/diseasePresets';
import { interventionPackages } from '../data/interventions';
import { populationDatasets } from '../data/scenarioLibrary';
import { Access, Scenario, ScenarioDraft, ScenarioShare } from '../types/scenarios';

export const findDataset = (id: string | null) => populationDatasets.find((d) => d.id === id);
export const findPreset = (id: string | null) => diseasePresets.find((p) => p.id === id);
export const findPackage = (id: string | null) => interventionPackages.find((p) => p.id === id);

export const datasetLabel = (s: Pick<Scenario, 'datasetId' | 'datasetVersion'>) => {
  const d = findDataset(s.datasetId);
  if (!d) return 'No dataset';
  return `${d.name} - v${s.datasetVersion ?? d.version}`;
};

export const packageLabel = (id: string | null) => findPackage(id)?.name ?? 'No interventions';

export const formatPop = (n: number) => n.toLocaleString('en-US');

export const pct = (v: number) => `${Math.round(v * 1000) / 10}%`;

export const PERMISSION_LABELS = { view: 'Can view', clone: 'Can clone' } as const;

/** Best permission any share gives this user (directly or via their institution). */
export function accessFor(s: Scenario, user: string, institution: string, isAdmin: boolean): Access | null {
  if (s.owner === user) return 'owner';
  if (isAdmin) return 'admin';
  if (s.draft) return null;
  const matches = s.shares.filter((sh: ScenarioShare) => sh.kind === 'user' ? sh.target === user : sh.target === institution);
  if (!matches.length) return null;
  return matches.some((m) => m.permission === 'clone') ? 'clone' : 'view';
}

export const toDraft = (s: Scenario, name = s.name): ScenarioDraft => ({
  name,
  description: s.description,
  datasetId: s.datasetId,
  presetId: s.presetId,
  packageId: s.packageId,
  visibility: s.shares.some((sh) => sh.kind === 'institution' && sh.target === s.ownerInstitution) ? 'institution' : 'private'
});

export const BLANK_SCENARIO: ScenarioDraft = {
  name: '',
  description: '',
  datasetId: null,
  presetId: null,
  packageId: null,
  visibility: 'private'
};

export const todayLabel = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });