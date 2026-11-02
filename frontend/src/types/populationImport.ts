export type ImportFormat = 'microdata' | 'aggregate';
export type DetectedFormat = ImportFormat | 'unknown';
export type ImportStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';
export type AggregateStatus = 'idle' | 'running' | 'done';

export interface UploadedFile {
  name: string;
  sizeBytes: number;
  /** Data rows, excluding the header. */
  rows: number;
  rowsEstimated: boolean;
  columns: string[];
  /** First data rows, keyed by file column. */
  sampleRows: Record<string, string>[];
  /** True when every row was read (small files), so checks cover the whole file. */
  fullyRead: boolean;
  isSample: boolean;
}

export interface FieldSpec {
  key: string;
  label: string;
  help: string;
  required: boolean;
  /** File column names we recognise for this field. */
  synonyms: string[];
}

export type Mapping = Record<string, string>;

export type IssueKind = 'Age out of range' | 'Invalid region code' | 'Missing required value' | 'Unrecognised value';

export interface CellIssue {
  /** EpiSim field key. */
  field: string;
  level: 'error' | 'warning';
  kind: IssueKind | 'Check value';
  message: string;
}

export interface CheckedRow {
  /** Line number in the file (header is line 1). */
  line: number;
  values: Record<string, string>;
  issues: CellIssue[];
}

export interface ValidationSummary {
  totalRows: number;
  checkedRows: number;
  validRows: number;
  errorRows: number;
  warningRows: number;
  breakdown: {kind: string;count: number;}[];
  /** True when the counts come from part of the file only. */
  partial: boolean;
  preview: CheckedRow[];
  /** Every flagged row found during checking, for the error report. */
  flagged: CheckedRow[];
}

export interface RegionOption {
  code: string;
  name: string;
}

export interface ImportDetails {
  name: string;
  provinceCode: string;
  districtCode: string;
  sectorCode: string;
  year: string;
  source: string;
}

export interface ExistingDataset {
  id: string;
  name: string;
  latestVersion: number;
  scenariosUsing: number;
}