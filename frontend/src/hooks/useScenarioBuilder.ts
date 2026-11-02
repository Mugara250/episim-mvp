import { useMemo, useState } from 'react';
import { BuilderMode, SaveAction, Scenario, ScenarioDraft } from '../types/scenarios';
import { BLANK_SCENARIO, toDraft } from '../utils/scenarios';
import { Toasts } from './useToasts';

export const BUILDER_STEPS = ['Population dataset', 'Disease', 'Interventions', 'Name and review'] as const;

interface Options {
  mode: BuilderMode;
  scenarios: Scenario[];
  userName: string;
  initialStep?: number;
  toasts: Toasts;
  onSave: (draft: ScenarioDraft, action: SaveAction, editingId: string | null) => void;
}

export function useScenarioBuilder({ mode, scenarios, userName, initialStep, toasts, onSave }: Options) {
  const baseId = mode.kind === 'clone' ? mode.fromId : mode.kind === 'new' ? null : mode.id;
  const base = scenarios.find((s) => s.id === baseId) ?? null;
  const readOnly = mode.kind === 'view';
  const editingId = mode.kind === 'draft' ? mode.id : null;

  const [draft, setDraft] = useState<ScenarioDraft>(() => {
    if (!base) return BLANK_SCENARIO;
    if (mode.kind === 'clone') return { ...toDraft(base, `Copy of ${base.name}`), visibility: 'private' };
    return toDraft(base);
  });
  const [step, setStep] = useState(() => {
    if (initialStep !== undefined) return initialStep;
    if (mode.kind === 'clone' || mode.kind === 'view') return 3;
    if (mode.kind === 'draft' && base) return !base.datasetId ? 0 : !base.presetId ? 1 : 3;
    return 0;
  });
  // The interventions step is optional; it counts as answered once visited.
  const [seenInterventions, setSeenInterventions] = useState(mode.kind !== 'new' || (initialStep ?? 0) > 2);
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState<SaveAction | null>(null);

  const errors = useMemo(() => {
    const e: Partial<Record<'name' | 'datasetId' | 'presetId', string>> = {};
    const name = draft.name.trim();
    if (!name) e.name = 'Give the scenario a name.';else
    if (scenarios.some((s) => s.owner === userName && s.id !== editingId && s.name.toLowerCase() === name.toLowerCase()))
    e.name = 'You already have a scenario with this name.';
    if (!draft.datasetId) e.datasetId = 'Choose a population dataset.';
    if (!draft.presetId) e.presetId = 'Choose a disease.';
    return e;
  }, [draft, scenarios, userName, editingId]);

  const canNext = step === 0 ? !!draft.datasetId : step === 1 ? !!draft.presetId : true;
  const reachable = (i: number) => i <= step || i >= 1 && !!draft.datasetId && (i < 2 || !!draft.presetId);

  const goTo = (i: number) => {
    if (readOnly || !reachable(i)) return;
    if (i >= 2) setSeenInterventions(true);
    setStep(i);
  };
  const next = () => canNext && goTo(Math.min(step + 1, 3));
  const back = () => setStep((s) => Math.max(0, s - 1));
  const skipInterventions = () => {
    setDraft((d) => ({ ...d, packageId: null }));
    setSeenInterventions(true);
    setStep(3);
  };

  const save = (action: SaveAction) => {
    if (saving || readOnly) return;
    if (action !== 'draft') {
      setTried(true);
      const missing = Object.values(errors);
      if (missing.length) {
        toasts.push('error', missing.length === 1 ? missing[0] : `Complete ${missing.length} required items before saving.`);
        if (errors.datasetId) setStep(0);else
        if (errors.presetId) setStep(1);
        return;
      }
    }
    setSaving(action);
    toasts.later(() => {
      setSaving(null);
      onSave(draft, action, editingId);
    }, 500);
  };

  return {
    mode,
    base,
    readOnly,
    draft,
    setDraft,
    step,
    goTo,
    next,
    back,
    canNext,
    reachable,
    skipInterventions,
    seenInterventions,
    errors: tried ? errors : { ...(draft.name.trim() ? { name: errors.name } : {}) },
    saving,
    save
  };
}

export type BuilderState = ReturnType<typeof useScenarioBuilder>;