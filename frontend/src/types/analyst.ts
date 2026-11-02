import { SimResult, SimSettings } from '../lib/models/seihfr';

export type DiseaseName = 'Ebola' | 'Marburg';

export type DatasetStatus = 'Passed' | 'Warnings' | 'Failed';

export type IssueType = 'Missing days' | 'Duplicate entries' | 'Negative counts' | 'Late reports';

export interface IssueRow {
  /** Facility or district the row belongs to. Never a patient. */
  where: string;
  field: string;
  value: string;
  note: string;
}

export interface DatasetIssue {
  type: IssueType;
  severity: 'warning' | 'error';
  rows: IssueRow[];
}

export interface Dataset {
  id: string;
  name: string;
  source: string;
  lastUpdated: string;
  records: number;
  status: DatasetStatus;
  issues: DatasetIssue[];
}

export type ScenarioStatus = 'Completed' | 'Running' | 'Saved';

export interface ScenarioRecord {
  id: string;
  name: string;
  disease: DiseaseName;
  date: string;
  status: ScenarioStatus;
  thisWeek: boolean;
}

export interface SavedScenario {
  id: string;
  name: string;
  settings: SimSettings;
  result: SimResult;
  savedAt: string;
}

export type DraftStatus = 'Draft' | 'Pending approval' | 'Approved';

export interface ReportDraft {
  id: string;
  title: string;
  disease: DiseaseName;
  scenarioId: string;
  updated: string;
  status: DraftStatus;
  approvedBy?: string;
  summary: string;
}

export interface ApprovedParameterSet {
  diseaseId: 'ebola' | 'marburg';
  version: string;
  approvedBy: string;
  approvedOn: string;
  provisional: boolean;
}