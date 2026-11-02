import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { useSimulationRuns } from '../context/SimulationRunsContext';
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
  onNavigate: (route: string) => void;
}

function BuilderView({ s, mode, onNavigate }: BuilderViewProps) {
  const b = useScenarioBuilder({
    mode,
    scenarios: s.scenarios,
    userId: s.userId,
    toasts: s.toasts,
    onSave: s.save
  });
  const link = (route: string) => hasAccess(s.role, ROUTE_MODULES[route]) ? () => onNavigate(route) : undefined;
  if (mode.kind !== 'new' && !b.base) {
    return (
      <div className="max-w-7xl mx-auto bg-surface rounded-xl border border-border p-10 text-center">
        <p className="text-[14px] text-text-primary font-medium">This scenario isn’t available.</p>
        <p className="text-[13px] text-text-secondary mt-1">It may have been deleted, or it hasn’t been shared with you.</p>
        <button onClick={() => s.setMode(null)} className="mt-4 text-[13px] font-semibold text-primary hover:underline">Back to library</button>
      </div>);

  }
  return (
    <ScenarioBuilder
      b={b}
      refs={s.refs}
      institution={s.institution}
      canClone={!!b.base && s.canClone(b.base)}
      canRun={s.canRun}
      onClose={() => s.setMode(null)}
      onClone={() => b.base && s.setMode({ kind: 'clone', fromId: b.base.id })}
      onRun={() => b.base && s.run(b.base)}
      link={link} />);


}

export function Scenarios({ onNavigate }: {onNavigate: (route: string) => void;}) {
  const sim = useSimulationRuns();
  // "Edit scenario" on a failed run opens the clone wizard for that scenario.
  const [init] = useState<ScenarioScreenInit>(() => sim.cloneRequest ? { scenarioMode: 'clone', scenarioId: sim.cloneRequest } : {});
  useEffect(() => {
    if (sim.cloneRequest) sim.setCloneRequest(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const s = useScenarios(init, {
    onRun: (sc) => {
      sim.setPrefill({ scenarioId: sc.id });
      onNavigate('/simulation');
    }
  });
  const modeKey = s.mode ? `${s.mode.kind}-${'id' in s.mode ? s.mode.id : 'fromId' in s.mode ? s.mode.fromId : 'new'}` : 'library';

  if (s.loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-24 text-[13px] text-text-secondary">
        <Loader2 size={16} className="animate-spin" /> Loading scenarios…
      </div>);

  }
  if (s.error) {
    return (
      <div className="max-w-7xl mx-auto bg-surface rounded-xl border border-border p-10 text-center">
        <AlertTriangle size={20} className="mx-auto text-danger mb-2" />
        <p className="text-[14px] text-text-primary font-medium">Scenarios couldn’t be loaded.</p>
        <p className="text-[13px] text-text-secondary mt-1">{s.error.message}</p>
        <button onClick={() => s.retry()} className="mt-4 text-[13px] font-semibold text-primary hover:underline">Try again</button>
      </div>);

  }

  return (
    <>
      {s.mode ? <BuilderView key={modeKey} s={s} mode={s.mode} onNavigate={onNavigate} /> : <ScenarioLibrary s={s} />}
      {s.shareTarget &&
      <ShareDialog
        scenario={s.shareTarget}
        onClose={s.closeShare}
        onChange={(shares, text) => s.setShares(s.shareTarget!.id, shares, (t) => s.toasts.push('success', t), text)} />

      }
      {s.deleteTarget && <DeleteScenarioDialog scenario={s.deleteTarget} onCancel={s.cancelDelete} onConfirm={() => s.remove(s.deleteTarget!.id)} />}
      <PresetToasts toasts={s.toasts.toasts} onDismiss={s.toasts.dismiss} />
    </>);

}
