import React, { useEffect, useMemo, useRef, useState } from 'react';
import { History, PlayCircle } from 'lucide-react';
import { useScreenInit } from '../useScreenInit.js';
import { useAuth } from '../context/AuthContext';
import { useSimulationRuns } from '../context/SimulationRunsContext';
import { USER_INSTITUTIONS } from '../data/scenarioLibrary';
import { useToasts } from '../hooks/useToasts';
import { useSimulationForm } from '../hooks/useSimulationForm';
import { useRunHistory } from '../hooks/useRunHistory';
import { getAccessLevel, hasAccess } from '../lib/rbac';
import { SimTab, SimulationRun, SimulationsScreenInit } from '../types/simulationRuns';
import { accessFor } from '../utils/scenarios';
import { NewSimulationCard } from '../components/simulations/NewSimulationCard';
import { RunProgress } from '../components/simulations/RunProgress';
import { RunHistory } from '../components/simulations/RunHistory';
import { ModelInfoCard } from '../components/simulations/ModelInfoCard';
import { PresetToasts } from '../components/presets/PresetToasts';

export function Simulations({ onNavigate }: {onNavigate: (route: string) => void;}) {
  const init = useScreenInit() as SimulationsScreenInit;
  const { role, userName } = useAuth();
  const sim = useSimulationRuns();
  const toasts = useToasts();
  const isAdmin = role === 'admin';
  const institution = USER_INSTITUTIONS[role];
  const level = getAccessLevel(role, 'simulation');
  const canRun = level === 'full' || level === 'write';

  const access = (id: string) => {
    const sc = sim.findScenario(id);
    return sc ? accessFor(sc, userName, institution, isAdmin) : null;
  };
  const runnable = useMemo(
    () => sim.scenarios.filter((s) => !s.draft && (isAdmin || accessFor(s, userName, institution, isAdmin) !== null)),
    [sim.scenarios, userName, institution, isAdmin]
  );
  const visibleRuns = useMemo(
    () => sim.runs.filter((r) => isAdmin || access(r.scenarioId) !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sim.runs, sim.scenarios, userName, institution, isAdmin]
  );

  const [tab, setTab] = useState<SimTab>(init.simTab ?? (canRun ? 'run' : 'history'));
  const [activeId, setActiveId] = useState<string | null>(sim.demoRunId);
  const [loading, setLoading] = useState(true);
  const form = useSimulationForm(runnable, sim.prefill ?? { scenarioId: init.simScenarioId ?? null });
  const history = useRunHistory(visibleRuns, sim.findScenario, userName);

  // A prefill from the Scenario Library is used once.
  useEffect(() => {
    if (sim.prefill) sim.setPrefill(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (init.simLoading) return;
    const t = window.setTimeout(() => setLoading(false), 500);
    return () => window.clearTimeout(t);
  }, [init.simLoading]);

  const active = sim.runs.find((r) => r.id === activeId) ?? null;
  const lastStatus = useRef(active?.status);
  useEffect(() => {
    if (!active || active.status === lastStatus.current) return;
    lastStatus.current = active.status;
    if (active.status === 'failed') toasts.push('error', 'The simulation didn’t finish. See the details below.');
    if (active.status === 'completed') toasts.push('success', 'Simulation completed.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.status]);

  const start = (req: {scenarioId: string;horizonDays: number;initialCases: number;}) => {
    const id = sim.start(req);
    lastStatus.current = 'queued';
    setActiveId(id);
    setTab('run');
    toasts.push('success', 'Simulation queued. It will start in a moment.');
  };
  const run = () => {
    const req = form.request();
    if (req) start(req);
  };
  const cancel = (r: SimulationRun) => {
    sim.cancel(r.id);
    toasts.push('info', 'Run cancelled. No results were saved.');
  };
  const runAgain = (r: SimulationRun) => {
    form.load({ scenarioId: r.scenarioId, horizonDays: r.horizonDays, initialCases: r.initialCases });
    setActiveId(null);
    setTab('run');
  };
  const viewResults = () => toasts.push('info', 'Full charts open on the Results page, which isn’t built yet.');
  const compareSelected = () => {
    if (hasAccess(role, 'scenario')) onNavigate('/scenario');else
    toasts.push('info', 'Comparing runs isn’t available for your role yet.');
  };

  const activeAccess = active ? access(active.scenarioId) : null;
  const tabs: {id: SimTab;label: string;icon: typeof History;count?: number;}[] = [
  { id: 'run', label: 'Run', icon: PlayCircle },
  { id: 'history', label: 'History', icon: History, count: visibleRuns.length }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-[13px] text-text-secondary mb-2">Simulations</p>
        <h1 className="text-h1 text-text-primary mb-1">Simulations</h1>
        <p className="text-body text-text-secondary max-w-2xl">
          Run a saved scenario and follow its progress. Charts and detailed results are on the Results page.
        </p>
      </div>

      <div role="tablist" className="flex gap-6 border-b border-border">
        {tabs.map((t) =>
        <button
          key={t.id}
          role="tab"
          aria-selected={tab === t.id}
          onClick={() => setTab(t.id)}
          className={`pb-3 -mb-px border-b-2 text-[14px] font-semibold flex items-center gap-2 transition-colors ${
          tab === t.id ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`
          }>
          
            <t.icon size={16} />
            {t.label}
            {t.count !== undefined && <span className="px-1.5 py-0.5 rounded-full bg-surface-2 text-[11px] text-text-secondary">{t.count}</span>}
          </button>
        )}
      </div>

      {tab === 'run' ?
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">
          <div className="space-y-6 min-w-0">
            {active ?
          <RunProgress
            key={active.id}
            run={active}
            scenario={sim.findScenario(active.scenarioId)}
            canRun={canRun}
            canEditScenario={activeAccess === 'owner' || activeAccess === 'admin' || activeAccess === 'clone'}
            onCancel={() => cancel(active)}
            onViewResults={viewResults}
            onCompare={() => {
              history.select(active.id);
              setTab('history');
              toasts.push('info', 'Tick at least one more completed run, then choose Compare selected.');
            }}
            onRunAgain={() => runAgain(active)}
            onTryAgain={() => start({ scenarioId: active.scenarioId, horizonDays: active.horizonDays, initialCases: active.initialCases })}
            onEditScenario={() => {
              sim.setCloneRequest(active.scenarioId);
              onNavigate('/scenarios');
            }}
            onNew={() => {
              form.reset();
              setActiveId(null);
            }} /> :


          <NewSimulationCard
            form={form}
            scenarios={runnable}
            userName={userName}
            readOnly={!canRun}
            onRun={run}
            onOpenLibrary={hasAccess(role, 'scenarios') ? () => onNavigate('/scenarios') : undefined} />

          }
          </div>
          <ModelInfoCard />
        </div> :

      <RunHistory
        h={history}
        totalRuns={visibleRuns.length}
        loading={loading}
        userName={userName}
        canRun={canRun}
        findScenario={sim.findScenario}
        onView={viewResults}
        onCancel={cancel}
        onRunAgain={runAgain}
        onCompare={compareSelected}
        onStartFirst={() => setTab('run')} />

      }

      <p className="text-[12px] text-text-secondary">All numbers on this page are illustrative placeholders.</p>
      <PresetToasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>);

}