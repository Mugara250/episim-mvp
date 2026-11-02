import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { scenarioSeed } from '../data/scenarioLibrary';
import { simulationRunSeed } from '../data/simulationRuns';
import { Scenario } from '../types/scenarios';
import { RunRequest, SimulationRun, SimulationsScreenInit } from '../types/simulationRuns';
import { summarize } from '../utils/simulationRuns';
import { useAuth } from './AuthContext';

export type SimulationOutcome = 'succeed' | 'fail';

interface Prefill extends Partial<RunRequest> {
  scenarioId: string;
}

interface SimulationRunsValue {
  runs: SimulationRun[];
  scenarios: Scenario[];
  findScenario: (id: string) => Scenario | undefined;
  start: (req: RunRequest) => string;
  cancel: (id: string) => void;
  /** Pre-fills the Run tab, e.g. from "Run simulation" in the Scenario Library. */
  prefill: Prefill | null;
  setPrefill: (p: Prefill | null) => void;
  /** Scenarios created this session in the Scenario Library. */
  registerScenario: (s: Scenario) => void;
  /** Asks the Scenario Library to open the clone wizard for this scenario. */
  cloneRequest: string | null;
  setCloneRequest: (id: string | null) => void;
  /** Id of the demo run seeded for a Screens preview, if any. */
  demoRunId: string | null;
}

const SimulationRunsContext = createContext<SimulationRunsValue | null>(null);

const QUEUE_MS = 1400;
const RUN_MS = 5200;
const TICK_MS = 200;
const FAIL_AT = 0.45;
const DEMO_RUN_ID = 'RUN-0099';
const FAILURE_TEXT =
'The run stopped at day {day} because the population data couldn’t be read. This is usually temporary. Try again, and if it keeps happening, check the dataset on Population Data.';

function withSummaries(runs: SimulationRun[], scenarios: Scenario[]) {
  return runs.map((r) =>
  r.status === 'completed' && !r.summary ?
  { ...r, summary: summarize(scenarios.find((s) => s.id === r.scenarioId), r.horizonDays, r.initialCases) } :
  r
  );
}

function demoRun(init: SimulationsScreenInit, user: string, scenarios: Scenario[]): SimulationRun | null {
  if (!init.simRunState) return null;
  const scenarioId = init.simScenarioId ?? 'SC-1048';
  const state = init.simRunState;
  const base: SimulationRun = {
    id: DEMO_RUN_ID,
    scenarioId,
    horizonDays: 90,
    initialCases: 3,
    status: state,
    requestedBy: user,
    startedAt: new Date(Date.now() - (state === 'queued' ? 2000 : 21000)).toISOString(),
    durationSec: state === 'completed' ? 34 : state === 'failed' ? 19 : null,
    progress: state === 'running' ? 0.58 : state === 'completed' ? 1 : state === 'failed' ? FAIL_AT : 0,
    summary: null
  };
  if (state === 'failed') base.error = FAILURE_TEXT.replace('{day}', '41');
  return withSummaries([base], scenarios)[0];
}

export function SimulationRunsProvider({ children, outcome = 'succeed' }: {children: ReactNode;outcome?: SimulationOutcome;}) {
  const init = useScreenInit() as SimulationsScreenInit;
  const { userName } = useAuth();
  const [extra, setExtra] = useState<Scenario[]>([]);
  const scenarios = useMemo(() => [...extra, ...scenarioSeed.filter((s) => !extra.some((e) => e.id === s.id))], [extra]);
  const scenariosRef = useRef(scenarios);
  scenariosRef.current = scenarios;

  const [runs, setRuns] = useState<SimulationRun[]>(() => {
    if (init.simHistoryEmpty) return [];
    const seeded = withSummaries(simulationRunSeed, scenarioSeed);
    const demo = demoRun(init, userName, scenarioSeed);
    return demo ? [demo, ...seeded] : seeded;
  });
  const runsRef = useRef(runs);
  runsRef.current = runs;
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [cloneRequest, setCloneRequest] = useState<string | null>(null);
  const seq = useRef(100);
  const failNext = useRef(outcome === 'fail');
  const timers = useRef<Record<string, number[]>>({});

  const clearTimers = (id: string) => {
    ;(timers.current[id] ?? []).forEach((t) => {
      window.clearTimeout(t);
      window.clearInterval(t);
    });
    delete timers.current[id];
  };
  useEffect(() => () => Object.keys(timers.current).forEach(clearTimers), []);

  const patch = (id: string, fn: (r: SimulationRun) => SimulationRun) => setRuns((list) => list.map((r) => r.id === id ? fn(r) : r));
  const elapsed = (r: SimulationRun) => (Date.now() - new Date(r.startedAt).getTime()) / 1000;

  const begin = useCallback((id: string, shouldFail: boolean) => {
    const interval = window.setInterval(() => {
      const current = runsRef.current.find((r) => r.id === id);
      if (!current || current.status !== 'running') {
        clearTimers(id);
        return;
      }
      const progress = Math.min(1, current.progress + TICK_MS / RUN_MS);
      if (shouldFail && progress >= FAIL_AT) {
        clearTimers(id);
        const day = Math.round(FAIL_AT * current.horizonDays);
        patch(id, (r) => ({ ...r, status: 'failed', progress, durationSec: elapsed(r), error: FAILURE_TEXT.replace('{day}', String(day)) }));
        return;
      }
      if (progress >= 1) {
        clearTimers(id);
        const scenario = scenariosRef.current.find((s) => s.id === current.scenarioId);
        const summary = summarize(scenario, current.horizonDays, current.initialCases);
        patch(id, (r) =>
        summary ?
        { ...r, status: 'completed', progress: 1, durationSec: elapsed(r), summary } :
        {
          ...r,
          status: 'failed',
          progress,
          durationSec: elapsed(r),
          error: 'This scenario’s population dataset or disease preset is no longer available, so the run couldn’t finish. Clone the scenario and choose them again.'
        }
        );
        return;
      }
      patch(id, (r) => ({ ...r, progress }));
    }, TICK_MS);
    timers.current[id] = [...(timers.current[id] ?? []), interval];
  }, []);

  // Resume the seeded demo run so the Screens preview animates like a real one.
  useEffect(() => {
    runsRef.current.filter((r) => r.id === DEMO_RUN_ID && (r.status === 'queued' || r.status === 'running')).forEach((r) => {
      if (r.status === 'running') begin(r.id, false);else
      {
        const t = window.setTimeout(() => {
          patch(r.id, (x) => x.status === 'queued' ? { ...x, status: 'running' } : x);
          begin(r.id, false);
        }, QUEUE_MS);
        timers.current[r.id] = [t];
      }
    });
  }, [begin]);

  const start = useCallback(
    (req: RunRequest) => {
      const id = `RUN-0${++seq.current}`;
      const shouldFail = failNext.current;
      failNext.current = false;
      setRuns((list) => [
      {
        id,
        ...req,
        status: 'queued',
        requestedBy: userName,
        startedAt: new Date().toISOString(),
        durationSec: null,
        progress: 0,
        summary: null
      },
      ...list]
      );
      const t = window.setTimeout(() => {
        if (runsRef.current.find((r) => r.id === id)?.status !== 'queued') return;
        patch(id, (r) => ({ ...r, status: 'running' }));
        begin(id, shouldFail);
      }, QUEUE_MS);
      timers.current[id] = [t];
      return id;
    },
    [userName, begin]
  );

  const cancel = useCallback((id: string) => {
    clearTimers(id);
    patch(id, (r) => r.status === 'queued' || r.status === 'running' ? { ...r, status: 'cancelled', durationSec: elapsed(r) } : r);
  }, []);

  const registerScenario = useCallback((s: Scenario) => setExtra((list) => [s, ...list.filter((x) => x.id !== s.id)]), []);
  const findScenario = useCallback((id: string) => scenarios.find((s) => s.id === id), [scenarios]);

  return (
    <SimulationRunsContext.Provider
      value={{
        runs,
        scenarios,
        findScenario,
        start,
        cancel,
        prefill,
        setPrefill,
        registerScenario,
        cloneRequest,
        setCloneRequest,
        demoRunId: init.simRunState ? DEMO_RUN_ID : null
      }}>
      
      {children}
    </SimulationRunsContext.Provider>);

}

export function useSimulationRuns() {
  const ctx = useContext(SimulationRunsContext);
  if (!ctx) throw new Error('useSimulationRuns must be used within SimulationRunsProvider');
  return ctx;
}