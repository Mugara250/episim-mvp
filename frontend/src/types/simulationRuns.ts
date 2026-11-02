export type RunStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface RunSummary {
  peakInfectious: number;
  peakDay: number;
  deaths: number;
  recovered: number;
}

export interface SimulationRun {
  id: string;
  scenarioId: string;
  horizonDays: number;
  initialCases: number;
  status: RunStatus;
  requestedBy: string;
  /** ISO timestamp */
  startedAt: string;
  /** Set once the run stops (completed, failed or cancelled). */
  durationSec: number | null;
  /** 0 to 1 while running */
  progress: number;
  summary: RunSummary | null;
  error?: string;
}

export interface RunRequest {
  scenarioId: string;
  horizonDays: number;
  initialCases: number;
}

export type SimTab = 'run' | 'history';

export interface SimulationsScreenInit {
  simTab?: SimTab;
  simScenarioId?: string;
  simRunState?: 'queued' | 'running' | 'completed' | 'failed';
  simLoading?: boolean;
  simHistoryEmpty?: boolean;
}