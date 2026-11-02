import { createContext, ReactNode, useContext, useState } from 'react';
import { RunRequest } from '../types/simulationRuns';

// Cross-page hand-offs between the Scenario Library and the Simulations page.
// Runs and scenarios themselves come from the API (src/api/simulations.ts, src/api/scenarios.ts).

interface Prefill extends Partial<RunRequest> {
  scenarioId: string;
}

interface SimulationRunsValue {
  /** Pre-fills the Run tab, e.g. from "Run simulation" in the Scenario Library. */
  prefill: Prefill | null;
  setPrefill: (p: Prefill | null) => void;
  /** Asks the Scenario Library to open the clone wizard for this scenario. */
  cloneRequest: string | null;
  setCloneRequest: (id: string | null) => void;
}

const SimulationRunsContext = createContext<SimulationRunsValue | null>(null);

export function SimulationRunsProvider({ children }: {children: ReactNode;}) {
  const [prefill, setPrefill] = useState<Prefill | null>(null);
  const [cloneRequest, setCloneRequest] = useState<string | null>(null);
  return (
    <SimulationRunsContext.Provider value={{ prefill, setPrefill, cloneRequest, setCloneRequest }}>
      {children}
    </SimulationRunsContext.Provider>);

}

export function useSimulationRuns() {
  const ctx = useContext(SimulationRunsContext);
  if (!ctx) throw new Error('useSimulationRuns must be used within SimulationRunsProvider');
  return ctx;
}
