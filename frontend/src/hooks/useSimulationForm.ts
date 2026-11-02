import { useMemo, useState } from 'react';
import { Scenario } from '../types/scenarios';
import { RunRequest } from '../types/simulationRuns';
import { validateRunForm } from '../utils/simulationRuns';

interface Initial {
  scenarioId?: string | null;
  horizonDays?: number;
  initialCases?: number;
}

/** State and validation for the "New simulation" form. */
export function useSimulationForm(scenarios: Scenario[], initial: Initial) {
  const [scenarioId, setScenarioId] = useState<string | null>(initial.scenarioId ?? null);
  const [horizon, setHorizon] = useState(String(initial.horizonDays ?? 90));
  const [initialCases, setInitialCases] = useState(String(initial.initialCases ?? 1));
  const [touched, setTouched] = useState({ horizon: false, initial: false });

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? null;
  const errors = useMemo(() => validateRunForm(horizon, initialCases), [horizon, initialCases]);
  const valid = !!scenario && !errors.horizon && !errors.initial;

  const visibleErrors = {
    horizon: touched.horizon ? errors.horizon : undefined,
    initial: touched.initial ? errors.initial : undefined
  };

  const load = (v: Initial) => {
    setScenarioId(v.scenarioId ?? null);
    setHorizon(String(v.horizonDays ?? 90));
    setInitialCases(String(v.initialCases ?? 1));
    setTouched({ horizon: false, initial: false });
  };

  const request = (): RunRequest | null => {
    setTouched({ horizon: true, initial: true });
    if (!valid || !scenario) return null;
    return { scenarioId: scenario.id, horizonDays: Number(horizon), initialCases: Number(initialCases) };
  };

  return {
    scenario,
    scenarioId,
    setScenarioId,
    horizon,
    setHorizon: (v: string) => {
      setHorizon(v);
      setTouched((t) => ({ ...t, horizon: true }));
    },
    initialCases,
    setInitialCases: (v: string) => {
      setInitialCases(v);
      setTouched((t) => ({ ...t, initial: true }));
    },
    errors: visibleErrors,
    valid,
    load,
    reset: () => load({}),
    request
  };
}

export type SimulationForm = ReturnType<typeof useSimulationForm>;