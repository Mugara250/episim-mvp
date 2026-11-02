import React, { useEffect, useState } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { useSimulationRuns } from '../context/SimulationRunsContext';
import { diseasePresets } from '../data/diseasePresets';
import { interventionPackages, interventionTypes } from '../data/interventions';
import { populationDatasets } from '../data/scenarioLibrary';
import { hasAccess, ROUTE_MODULES } from '../lib/rbac';
import { ScenarioScreenInit, ScenariosState, useScenarios } from '../hooks/useScenarios';
import { useScenarioBuilder } from '../hooks/useScenarioBuilder';
import { BuilderMode } from '../types/scenarios';
import { ScenarioLibrary } from '../components/scenarios/ScenarioLibrary';
import { ScenarioBuilder } from '../components/scenarios/ScenarioBuilder';
import { ShareDialog } from '../components/scenarios/ShareDialog';
import { DeleteScenarioDialog } from '../components/scenarios/DeleteScenarioDialog';
import { PresetToasts } from '../components/presets/PresetToasts';

interface BuilderViewProps {
  s: ScenariosState;
  mode: BuilderMode;
  init: ScenarioScreenInit;
  onNavigate: (route: string) => void;
}

function BuilderView({ s, mode, init, onNavigate }: BuilderViewProps) {
  const b = useScenarioBuilder({
    mode,
    scenarios: s.scenarios,
    userName: s.userName,
    // Screen presets only apply to the builder the page opened with.
    initialStep: mode.kind === init.scenarioMode ? init.builderStep : undefined,
    toasts: s.toasts,
    onSave: s.save
  });
  const empty = !!init.scenarioNoConfig;
  const link = (route: string) => hasAccess(s.role, ROUTE_MODULES[route]) ? () => onNavigate(route) : undefined;
  return (
    <ScenarioBuilder
      b={b}
      datasets={empty ? [] : populationDatasets}
      presets={empty ? [] : diseasePresets}
      packages={empty ? [] : interventionPackages}
      types={interventionTypes}
      institution={s.institution}
      canClone={!!b.base && s.canClone(b.base)}
      canRun={s.canRun}
      onClose={() => s.setMode(null)}
      onClone={() => b.base && s.setMode({ kind: 'clone', fromId: b.base.id })}
      onRun={() => b.base && s.run(b.base)}
      link={link} />);


}

export function Scenarios({ onNavigate }: {onNavigate: (route: string) => void;}) {
  const screenInit = useScreenInit() as ScenarioScreenInit;
  const sim = useSimulationRuns();
  // "Edit scenario" on a failed run opens the clone wizard for that scenario.
  const [init] = useState<ScenarioScreenInit>(() =>
  sim.cloneRequest ? { ...screenInit, scenarioMode: 'clone', scenarioId: sim.cloneRequest, builderStep: undefined } : screenInit
  );
  useEffect(() => {
    if (sim.cloneRequest) sim.setCloneRequest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const s = useScenarios(init, {
    onSaved: sim.registerScenario,
    onRun: (sc) => {
      sim.registerScenario(sc);
      sim.setPrefill({ scenarioId: sc.id });
      onNavigate('/simulation');
    }
  });
  const modeKey = s.mode ? `${s.mode.kind}-${'id' in s.mode ? s.mode.id : 'fromId' in s.mode ? s.mode.fromId : 'new'}` : 'library';

  return (
    <>
      {s.mode ? <BuilderView key={modeKey} s={s} mode={s.mode} init={init} onNavigate={onNavigate} /> : <ScenarioLibrary s={s} />}
      {s.shareTarget &&
      <ShareDialog
        scenario={s.shareTarget}
        onClose={s.closeShare}
        onChange={(shares) => s.setShares(s.shareTarget!.id, shares)}
        onShared={(text) => s.toasts.push('success', text)} />

      }
      {s.deleteTarget && <DeleteScenarioDialog scenario={s.deleteTarget} onCancel={s.cancelDelete} onConfirm={() => s.remove(s.deleteTarget!.id)} />}
      <PresetToasts toasts={s.toasts.toasts} onDismiss={s.toasts.dismiss} />
    </>);

}