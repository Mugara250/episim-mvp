import type { components } from '../api/schema';

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ModelType = 'seihfr' | 'seihfr_geo';

/** 5th, 50th and 95th percentile across Monte Carlo runs. */
export interface Range {
  low: number;
  median: number;
  high: number;
}

/** One day of a fan chart. */
export interface Band extends Range {
  day: number;
}

/** Daily bands as the API stores them: one array per percentile. */
export interface ColumnarBand {
  low: number[];
  median: number[];
  high: number[];
}

export interface RunSummaryRanges {
  pTakeOff: number;
  pOver50: number;
  pOver100: number;
  finalCases: Range;
  finalDeaths: Range;
  peakBeds: Range;
  hcwShare: Range;
  peakInfectious: Range;
  peakDay: Range;
  recovered: Range;
}

/** Summary tiles for a completed run (medians, with ranges). */
export interface RunSummary {
  peakInfectious: number;
  peakDay: number;
  deaths: number;
  recovered: number;
  ranges?: RunSummaryRanges;
}

/** A simulation run as returned by GET /api/simulations. */
export type SimulationRun = Omit<components['schemas']['RunOut'], 'status' | 'summary' | 'modelType'> & {
  status: RunStatus;
  modelType: ModelType;
  summary: RunSummary | null;
};

export interface HcwSettings {
  pool: number;
  ppeBefore: number;
  ppeAfter: number;
  recognitionDay: number;
}

export interface RunRequest {
  scenarioId: string;
  horizonDays: number;
  initialCases: number;
  modelType?: ModelType;
  seedDistrictCode?: string | null;
  monteCarloRuns?: number;
  seed?: number | null;
  hcw?: HcwSettings | null;
}

export type SimTab = 'run' | 'history';

// ── Results (GET /simulations/{id}/results*) ──────────────

export interface CapacityCheck {
  profileId: string;
  profileName: string;
  placeholder: boolean;
  beds: number;
  pBedsExceeded: number;
  /** First day the median bed demand exceeds the beds (null = never). */
  bedsRunOutDay: number | null;
  /** Same, on the 95th percentile: the pessimistic case. */
  bedsRunOutDayHigh: number | null;
}

export interface RunInputs {
  modelType: ModelType;
  seed: number;
  monteCarloRuns: number;
  horizonDays: number;
  initialCases: number;
  engineVersion: string;
  seedDistrictCode: string | null;
  disease: {presetId: string;presetVersion: number;key: string;name: string;r0: number;provisional: boolean;reference: string;};
  population: {datasetId: string;datasetName: string;datasetVersion: number;total: number;illustrative: boolean;districtCount: number;};
  interventions: {
    packageId: string | null;
    packageName: string | null;
    // Snapshot items keep the engine's snake_case keys.
    items: {type_name: string | null;type_key: string;lever: string;start_day: number;end_day: number | null;coverage: number;effect: number;placeholder: boolean | null;}[];
  };
  /** Engine snapshot keys: pool, ppe_before, ppe_after, recognition_day. */
  hcw: Record<string, number>;
}

export interface RunResults {
  runId: string;
  modelType: ModelType;
  label: string;
  provisional: boolean;
  notes: string[];
  summary: RunSummaryRanges;
  capacity: CapacityCheck | null;
  inputs: RunInputs;
}

export type SeriesKey =
'active' |
'hospitalised' |
'funerals' |
'cumulative' |
'deaths' |
'hcw_cumulative' |
'community_cumulative' |
'incidence';

export interface RunSeries {
  runId: string;
  days: number;
  label: string;
  provisional: boolean;
  notes: string[];
  series: Partial<Record<SeriesKey, ColumnarBand>>;
}

export interface HcwResults {
  runId: string;
  label: string;
  provisional: boolean;
  notes: string[];
  settings: Record<string, number>;
  hcwShare: Range;
  hcwInfections: Range;
  series: {hcwCumulative: ColumnarBand;communityCumulative: ColumnarBand;};
}

export interface HcwWhatIfSide {
  hcwInfections: Range;
  hcwShare: Range;
  finalCases: Range;
  hcwCumulative: ColumnarBand;
}

export interface HcwWhatIf {
  runId: string;
  preview: boolean;
  runs: number;
  label: string;
  notes: string[];
  settings: Record<string, number>;
  before: HcwWhatIfSide;
  after: HcwWhatIfSide;
}

export interface RtPoint {
  day: number;
  cases: number;
  rt: number | null;
  low: number | null;
  high: number | null;
}

export type Trend = 'growing' | 'shrinking' | 'uncertain' | 'not-enough-data';

export interface RunRt {
  runId: string;
  label: string;
  provisional: boolean;
  notes: string[];
  points: RtPoint[];
  trend: Trend;
}

/** Columnar bands → one row per day, for charts. */
export function toBands(c: ColumnarBand | undefined): Band[] {
  if (!c) return [];
  return c.median.map((median, day) => ({ day, low: c.low[day] ?? median, median, high: c.high[day] ?? median }));
}
