import type { components } from '../api/schema';

type S = components['schemas'];

export type SharePermission = 'view' | 'clone';

/** A share as returned by the API: `target` is the display name, `targetId` the user or institution id. */
export type ScenarioShare = S['ShareOut'];

/** A population dataset option (latest version) for the Scenario Builder. */
export type PopulationDataset = S['DatasetOut'];

/** A scenario as returned by GET /api/scenarios. `access` is computed by the server for the current user. */
export type Scenario = S['ScenarioOut'];

/** Disease preset, intervention package and type as the builder shows them (SEIHFR fields). */
export type PresetRef = S['PresetOut'];
export type PackageRef = S['PackageOut'];
export type InterventionTypeRef = S['TypeOut'];

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
