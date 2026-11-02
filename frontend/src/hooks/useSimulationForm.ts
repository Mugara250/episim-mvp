import { useMemo, useState } from 'react';
import { Scenario } from '../types/scenarios';
import { HcwSettings, ModelType, RunRequest } from '../types/simulationRuns';
import { validateRunForm } from '../utils/simulationRuns';

interface Initial {
  scenarioId?: string | null;
  horizonDays?: number;
  initialCases?: number;
  modelType?: ModelType;
  seedDistrictCode?: string | null;
  hcw?: HcwSettings | null;
}

/** Placeholder defaults; the backend fills disease-specific values when hcw is omitted. */
export const DEFAULT_HCW: HcwSettings = { pool: 600, ppeBefore: 0.3, ppeAfter: 0.85, recognitionDay: 14 };

/** State and validation for the "New simulation" form. */
export function useSimulationForm(scenarios: Scenario[], initial: Initial) {
  const [scenarioId, setScenarioId] = useState<string | null>(initial.scenarioId ?? null);
  const [horizon, setHorizon] = useState(String(initial.horizonDays ?? 90));
  const [initialCases, setInitialCases] = useState(String(initial.initialCases ?? 3));
  const [modelType, setModelType] = useState<ModelType>(initial.modelType ?? 'seihfr');
  const [seedDistrictCode, setSeedDistrictCode] = useState<string | null>(initial.seedDistrictCode ?? null);
  const [hcw, setHcw] = useState<HcwSettings | null>(initial.hcw ?? null);
  const [touched, setTouched] = useState({ horizon: false, initial: false, district: false });

  const scenario = scenarios.find((s) => s.id === scenarioId) ?? null;
  const errors = useMemo(() => {
    const e: {horizon?: string;initial?: string;district?: string;} = validateRunForm(horizon, initialCases);
    if (modelType === 'seihfr_geo') {
      if (!seedDistrictCode) e.district = 'Choose the district where the outbreak starts.';else
      if (scenario && scenario.districtCodes.length && !scenario.districtCodes.includes(seedDistrictCode))
      e.district = 'This district isn’t in the scenario’s population dataset.';
    }
    return e;
  }, [horizon, initialCases, modelType, seedDistrictCode, scenario]);
  const valid = !!scenario && !errors.horizon && !errors.initial && !errors.district;

  const visibleErrors = {
    horizon: touched.horizon ? errors.horizon : undefined,
    initial: touched.initial ? errors.initial : undefined,
    district: touched.district ? errors.district : undefined
  };

  const load = (v: Initial) => {
    setScenarioId(v.scenarioId ?? null);
    setHorizon(String(v.horizonDays ?? 90));
    setInitialCases(String(v.initialCases ?? 3));
    setModelType(v.modelType ?? 'seihfr');
    setSeedDistrictCode(v.seedDistrictCode ?? null);
    setHcw(v.hcw ?? null);
    setTouched({ horizon: false, initial: false, district: false });
  };

  const request = (): RunRequest | null => {
    setTouched({ horizon: true, initial: true, district: true });
    if (!valid || !scenario) return null;
    return {
      scenarioId: scenario.id,
      horizonDays: Number(horizon),
      initialCases: Number(initialCases),
      modelType,
      seedDistrictCode: modelType === 'seihfr_geo' ? seedDistrictCode : null,
      hcw
    };
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
    modelType,
    setModelType,
    seedDistrictCode,
    setSeedDistrictCode: (v: string | null) => {
      setSeedDistrictCode(v);
      setTouched((t) => ({ ...t, district: true }));
    },
    hcw,
    setHcw,
    errors: visibleErrors,
    valid,
    load,
    reset: () => load({}),
    request
  };
}

export type SimulationForm = ReturnType<typeof useSimulationForm>;
