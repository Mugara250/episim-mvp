export type SharePermission = 'view' | 'clone';

export interface ScenarioShare {
  id: string;
  kind: 'user' | 'institution';
  /** User name or institution name */
  target: string;
  permission: SharePermission;
}

export interface PopulationDataset {
  id: string;
  name: string;
  coverage: string;
  source: string;
  population: number;
  /** Latest imported version */
  version: number;
  lastImported: string;
}

export interface Scenario {
  id: string;
  name: string;
  description: string;
  datasetId: string | null;
  /** Pinned when the scenario is saved */
  datasetVersion: number | null;
  presetId: string | null;
  /** null = no interventions */
  packageId: string | null;
  owner: string;
  ownerInstitution: string;
  created: string;
  draft: boolean;
  shares: ScenarioShare[];
}

export type Visibility = 'private' | 'institution';

export interface ScenarioDraft {
  name: string;
  description: string;
  datasetId: string | null;
  presetId: string | null;
  packageId: string | null;
  visibility: Visibility;
}

export type LibraryTab = 'mine' | 'shared';

/** What the current user may do with a scenario. */
export type Access = 'owner' | 'admin' | 'clone' | 'view';

export type BuilderMode =
{kind: 'new';} |
{kind: 'clone';fromId: string;} |
{kind: 'draft';id: string;} |
{kind: 'view';id: string;};

export type SaveAction = 'draft' | 'save' | 'run';