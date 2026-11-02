import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { History, PlayCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSimulationRuns } from '../context/SimulationRunsContext';
import { useScenarioList } from '../api/scenarios';
import { useCancelRun, useRun, useRunList, useStartRun } from '../api/simulations';
import { useToasts } from '../hooks/useToasts';
import { useSimulationForm } from '../hooks/useSimulationForm';
import { useRunHistory } from '../hooks/useRunHistory';
import { getAccessLevel, hasAccess } from '../lib/rbac';
import { RunRequest, SimTab, SimulationRun } from '../types/simulationRuns';
import { NewSimulationCard } from '../components/simulations/NewSimulationCard';
import { RunProgress } from '../components/simulations/RunProgress';
import { RunHistory } from '../components/simulations/RunHistory';
import { ModelInfoCard } from '../components/simulations/ModelInfoCard';
import { PresetToasts } from '../components/presets/PresetToasts';

export function Simulations({ onNavigate }: {onNavigate: (route: string) => void;}) {
  const { role, user } = useAuth();
  const sim = useSimulationRuns();
  const toasts = useToasts();
  const [params, setParams] = useSearchParams();
  const level = getAccessLevel(role, 'simulation');
  const canRun = level === 'full' || level === 'write';
  const userId = user?.id ?? '';

  const scenarioList = useScenarioList();
  const runList = useRunList();
  const startRun = useStartRun();
  const cancelRun = useCancelRun();

  // Runnable: saved scenarios the user may see (the server only lists those it may access).
  const runnable = useMemo(() => (scenarioList.data ?? []).filter((s) => !s.draft && s.access !== null), [scenarioList.data]);
  const runs = runList.data ?? [];

  // The watched run lives in the address (?run=RUN-0143) so a refresh or shared link keeps it.
  const activeId = params.get('run');
  const setActiveId = (id: string | null) =>
  setParams((p) => {
    const next = new URLSearchParams(p);
    if (id) next.set('run', id);else
    next.delete('run');
    return next;
  });
  const [tab, setTab] = useState<SimTab>(params.get('tab') === 'history' || !canRun ? 'history' : 'run');
  const form = useSimulationForm(runnable, sim.prefill ?? { scenarioId: params.get('scenario') });
  const history = useRunHistory(runs, userId);

  // A prefill from the Scenario Library is used once (it can arrive after the scenario list loads).
  useEffect(() => {
    if (!sim.prefill) return;
    form.load(sim.prefill);
    sim.setPrefill(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeQuery = useRun(activeId);
  const active: SimulationRun | null = activeQuery.data ?? runs.find((r) => r.id === activeId) ?? null;
  const lastStatus = useRef(active?.status);
  useEffect(() => {
    if (!active || active.status === lastStatus.current) return;
    const was = lastStatus.current;
    lastStatus.current = active.status;
    if (!was) return; // first load of an existing run: no toast
    if (active.status === 'failed') toasts.push('error', 'The simulation didn’t finish. See the details below.');
    if (active.status === 'completed') toasts.push('success', 'Simulation completed.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.status]);

  const start = (req: RunRequest) => {
    startRun.mutate(req, {
      onSuccess: (run) => {
        lastStatus.current = run.status;
        setActiveId(run.id);
        setTab('run');
        toasts.push('success', 'Simulation queued. It will start in a moment.');
      },
      onError: (e) => toasts.push('error', e.message)
    });
  };
  const run = () => {
    const req = form.request();
    if (req) start(req);
  };
  const cancel = (r: SimulationRun) =>
  cancelRun.mutate(r.id, {
    onSuccess: () => toasts.push('info', 'Run cancelled. No results were saved.'),
    onError: (e) => toasts.push('error', e.message)
  });
  const reqOf = (r: SimulationRun): RunRequest => ({
    scenarioId: r.scenarioId,
    horizonDays: r.horizonDays,
    initialCases: r.initialCases,
    modelType: r.modelType,
    seedDistrictCode: r.seedDistrictCode
  });
  const runAgain = (r: SimulationRun) => {
    form.load(reqOf(r));
    setActiveId(null);
    setTab('run');
  };
  const viewResults = (r: SimulationRun) => onNavigate(`/simulation/runs/${r.id}`);
  const openMap = (r: SimulationRun) => onNavigate(`/geographic?run=${r.id}`);
  const canCompare = hasAccess(role, 'scenario');
  const canReport = getAccessLevel(role, 'reports') === 'full';
  const compare = (ids: string[]) => {
    if (canCompare) onNavigate(`/scenario?runs=${ids.join(',')}`);else
    toasts.push('info', 'Comparing runs isn’t available for your role.');
  };

  const tabs: {id: SimTab;label: string;icon: typeof History;count?: number;}[] = [
  { id: 'run', label: 'Run', icon: PlayCircle },
  { id: 'history', label: 'History', icon: History, count: runs.length }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-[13px] text-text-secondary mb-2">Simulations</p>
        <h1 className="text-h1 text-text-primary mb-1">Simulations</h1>
        <p className="text-body text-text-secondary max-w-2xl">
          Run a saved scenario and follow its progress. Runs execute on the server, so you can leave this page while they work.
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
            canRun={canRun}
            cancelling={cancelRun.isPending}
            canEditScenario={canRun}
            onCancel={() => cancel(active)}
            onViewResults={() => viewResults(active)}
            onMap={() => openMap(active)}
            onCompare={() => {
              history.select(active.id);
              setTab('history');
              toasts.push('info', 'Tick at least one more completed run, then choose Compare selected.');
            }}
            onRunAgain={() => runAgain(active)}
            onTryAgain={() => start(reqOf(active))}
            onEditScenario={() => {
              sim.setCloneRequest(active.scenarioId);
              onNavigate('/scenarios');
            }}
            onNew={() => {
              form.reset();
              setActiveId(null);
            }} /> :

          activeId && activeQuery.isLoading ?
          <div className="bg-surface rounded-xl border border-border p-8 text-[13px] text-text-secondary">Loading run {activeId}…</div> :
          scenarioList.isLoading ?
          <div className="bg-surface rounded-xl border border-border p-8 text-[13px] text-text-secondary">Loading scenarios…</div> :
          scenarioList.error ?
          <div className="bg-surface rounded-xl border border-border p-8 text-[13px] text-danger">
              Scenarios couldn’t be loaded: {scenarioList.error.message}{' '}
              <button onClick={() => scenarioList.refetch()} className="font-semibold text-primary hover:underline">Try again</button>
            </div> :

          <NewSimulationCard
            form={form}
            scenarios={runnable}
            userId={userId}
            readOnly={!canRun}
            starting={startRun.isPending}
            onRun={run}
            onOpenLibrary={hasAccess(role, 'scenarios') ? () => onNavigate('/scenarios') : undefined} />

          }
          </div>
          <ModelInfoCard />
        </div> :

      <RunHistory
        h={history}
        totalRuns={runs.length}
        loading={runList.isLoading}
        error={runList.error?.message ?? null}
        userId={userId}
        canRun={canRun}
        onView={viewResults}
        onMap={openMap}
        onReport={canReport ? (r) => onNavigate(`/reports?run=${r.id}`) : undefined}
        onCancel={cancel}
        onRunAgain={runAgain}
        onCompare={() => compare(history.selected)}
        onStartFirst={() => setTab('run')} />

      }

      <p className="text-[12px] text-text-secondary">
        Results are scenario estimates, not forecasts. Seeded sample scenarios use illustrative data.
      </p>
      <PresetToasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>);

}
