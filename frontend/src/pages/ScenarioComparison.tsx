import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertTriangle, Check, GitCompare, Link2, MessageSquare, Search } from 'lucide-react';
import { FanChart } from '../components/models/FanChart';
import { CHART, pct, round } from '../components/models/chartTheme';
import {
  Bands,
  Comparison,
  MetricValue,
  Range,
  Run,
  useCapacityOptions,
  useComparison,
  useRuns,
  useSaveComparison } from
'../api/comparison';

const MAX_RUNS = 3;
const COLORS = [CHART.primary, CHART.accent, CHART.blue];
const PERCENT_METRICS = new Set(['pTakeOff', 'pBedsExceeded', 'hcwShare']);
const STATUS_TEXT: Record<string, string> = {
  queued: 'Queued',
  running: 'Running',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

const toBands = (b: Bands | null | undefined) =>
(b?.median ?? []).map((m, day) => ({ day, low: b?.low[day] ?? m, median: m, high: b?.high[day] ?? m }));

function fmtValue(metric: string, v: number | null | undefined) {
  if (v === null || v === undefined) return '—';
  return PERCENT_METRICS.has(metric) ? pct(v) : round(v);
}

function fmtCell(metric: string, value: MetricValue['value']) {
  if (value === null || value === undefined) return { main: '—', sub: '' };
  if (typeof value === 'number') return { main: fmtValue(metric, value), sub: 'share of runs' };
  const r = value as Range;
  return { main: fmtValue(metric, r.median), sub: `${fmtValue(metric, r.low)}–${fmtValue(metric, r.high)}` };
}

function fmtDiff(metric: string, diff: number) {
  const sign = diff > 0 ? '+' : '−';
  const abs = Math.abs(diff);
  return PERCENT_METRICS.has(metric) ? `${sign}${(abs * 100).toFixed(0)} pts` : `${sign}${round(abs)}`;
}

const formatDate = (iso: string | null | undefined) =>
iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export function ScenarioComparison() {
  const [params, setParams] = useSearchParams();
  const selected = useMemo(() => (params.get('runs') ?? '').split(',').filter(Boolean).slice(0, MAX_RUNS), [params]);
  const capacityId = params.get('capacity');
  const baselineParam = params.get('baseline');
  const baselineId = baselineParam && selected.includes(baselineParam) ? baselineParam : selected[0] ?? null;

  const runsQ = useRuns();
  const optionsQ = useCapacityOptions();
  const cmpQ = useComparison(selected, capacityId, baselineId);
  const save = useSaveComparison();

  const [search, setSearch] = useState('');
  const [disease, setDisease] = useState('all');
  const [view, setView] = useState<'active' | 'beds'>('active');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const update = (next: {runs?: string[];capacity?: string | null;baseline?: string | null;}) => {
    const p = new URLSearchParams(params);
    const set = (k: string, v: string | null | undefined) => v ? p.set(k, v) : p.delete(k);
    if (next.runs !== undefined) set('runs', next.runs.join(','));
    if (next.capacity !== undefined) set('capacity', next.capacity);
    if (next.baseline !== undefined) set('baseline', next.baseline);
    setParams(p, { replace: true });
  };

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      const runs = selected.filter((x) => x !== id);
      update({ runs, baseline: baselineParam === id ? null : baselineParam });
    } else if (selected.length < MAX_RUNS) update({ runs: [...selected, id] });
  };

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(null), 2500);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      flash('Link copied. It opens these runs with the same capacity profile.');
    } catch {
      flash('Could not copy automatically. Copy the address from the browser bar.');
    }
  };

  const runs = runsQ.data ?? [];
  const diseases = Array.from(new Set(runs.map((r) => r.presetName).filter(Boolean))) as string[];
  const filtered = runs.filter(
    (r) =>
    (disease === 'all' || r.presetName === disease) && (
    !search.trim() || `${r.scenarioName} ${r.id} ${r.packageName ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()))
  );
  const completedCount = runs.filter((r) => r.status === 'completed').length;
  const colorOf = (id: string) => COLORS[selected.indexOf(id)] ?? CHART.muted;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Scenario Comparison</h1>
          <p className="text-body text-text-secondary">
            Compare up to three completed simulation runs. Scenario estimates, not forecasts.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copyLink}
            disabled={selected.length < 2}
            className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
            <Link2 size={16} className="mr-2" />
            Copy link
          </button>
        </div>
      </div>

      {toast &&
      <div role="status" className="fixed bottom-6 right-6 z-50 bg-sidebar-bg text-white text-[13px] px-4 py-3 rounded-lg shadow-lg">
          {toast}
        </div>
      }

      {runsQ.isError &&
      <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] rounded-xl p-4">
          Could not load simulation runs. {(runsQ.error as Error).message}
        </div>
      }

      {/* Completed runs list */}
      {runsQ.isLoading ?
      <div className="bg-surface p-6 rounded-xl border border-border text-[13px] text-text-secondary">Loading runs…</div> :
      completedCount === 0 ?
      <EmptyRuns /> :

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-h3 text-text-primary">Completed runs</h3>
              <p className="text-[12px] text-text-secondary mt-1">
                Pick up to {MAX_RUNS}. The first one you pick is the baseline. Runs that are still going or failed can’t be compared.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search runs"
                aria-label="Search runs"
                className="pl-8 pr-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary w-52" />
              </div>
              <select
              value={disease}
              onChange={(e) => setDisease(e.target.value)}
              aria-label="Filter by disease"
              className="px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
                <option value="all">All diseases</option>
                {diseases.map((d) =>
              <option key={d} value={d}>{d}</option>
              )}
              </select>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[360px]">
            <table className="w-full text-left">
              <thead className="bg-background border-b border-border sticky top-0">
                <tr>
                  <th className="px-6 py-3 w-10" />
                  {['Run', 'Disease', 'Population', 'Interventions', 'Runs', 'Date', 'Run by'].map((h) =>
                <th key={h} className="px-4 py-3 text-micro text-text-secondary">{h.toUpperCase()}</th>
                )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((r) =>
              <RunRow
                key={r.id}
                run={r}
                checked={selected.includes(r.id)}
                color={colorOf(r.id)}
                disabled={r.status !== 'completed' || !selected.includes(r.id) && selected.length >= MAX_RUNS}
                onToggle={() => toggle(r.id)} />
              )}
                {filtered.length === 0 &&
              <tr>
                    <td colSpan={8} className="px-6 py-6 text-[13px] text-text-secondary text-center">No runs match your search.</td>
                  </tr>
              }
              </tbody>
            </table>
          </div>
        </section>
      }

      {completedCount > 0 && selected.length < 2 &&
      <section className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-xl bg-hover text-primary flex items-center justify-center mb-4">
            <GitCompare size={22} />
          </span>
          <h2 className="text-h3 text-text-primary">Select at least 2 runs to compare</h2>
          <p className="text-[13px] text-text-secondary mt-1 max-w-sm">Tick runs in the list above. You can compare up to three.</p>
        </section>
      }

      {selected.length >= 2 &&
      <ComparisonBody
        cmp={cmpQ.data}
        loading={cmpQ.isLoading}
        error={cmpQ.isError ? (cmpQ.error as Error).message : null}
        selected={selected}
        baselineId={baselineId}
        onBaseline={(id) => update({ baseline: id })}
        capacityId={capacityId}
        onCapacity={(id) => update({ capacity: id })}
        options={optionsQ.data ?? []}
        view={view}
        onView={setView}
        colorOf={colorOf} />
      }

      {selected.length >= 2 && cmpQ.data &&
      <div className="bg-surface rounded-xl border border-border flex flex-col">
          <div className="p-6 border-b border-border flex items-center">
            <MessageSquare size={18} className="text-primary mr-2" />
            <h3 className="text-h3 text-text-primary">Notes &amp; Annotations</h3>
          </div>
          <div className="p-6 flex-1 flex flex-col">
            <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Assumptions, caveats or recommendations to keep with this comparison..."
            className="flex-1 w-full bg-background border border-border rounded-lg p-3 text-[13px] text-text-primary focus:outline-none focus:border-primary resize-none min-h-[120px]" />
            <div className="mt-4 flex justify-end">
              <button
              disabled={save.isPending}
              onClick={() =>
              save.mutate(
                {
                  name: cmpQ.data.runs.map((r) => r.scenarioName ?? r.id).join(' vs '),
                  notes,
                  runIds: selected,
                  baselineRunId: baselineId,
                  capacityProfileId: capacityId
                },
                {
                  onSuccess: (c) => flash(`Saved as ${c.id}.`),
                  onError: (e) => flash((e as Error).message)
                }
              )
              }
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60">
                {save.isPending ? 'Saving…' : 'Save comparison'}
              </button>
            </div>
          </div>
        </div>
      }
    </div>);

}

function EmptyRuns() {
  return (
    <section className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center">
      <span className="w-12 h-12 rounded-xl bg-hover text-primary flex items-center justify-center mb-4">
        <GitCompare size={22} />
      </span>
      <h2 className="text-h3 text-text-primary">No completed simulations yet</h2>
      <p className="text-[13px] text-text-secondary mt-1 max-w-sm">Run a scenario on the Simulations page. Completed runs appear here.</p>
      <Link to="/simulation" className="mt-5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
        Go to Simulations
      </Link>
    </section>);

}

function RunRow({ run, checked, color, disabled, onToggle }: {run: Run;checked: boolean;color: string;disabled: boolean;onToggle: () => void;}) {
  const done = run.status === 'completed';
  return (
    <tr className={`${done ? 'hover:bg-background/50' : 'opacity-50'} ${checked ? 'bg-hover' : ''}`}>
      <td className="px-6 py-3">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled && !checked}
          onChange={onToggle}
          aria-label={`Compare ${run.scenarioName}`}
          className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed"
          style={{ accentColor: color }} />
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
          {checked && <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />}
          {run.scenarioName}
        </div>
        <div className="text-[11px] text-text-secondary">
          {run.id}
          {run.modelType === 'seihfr_geo' ? ' · district model' : ''}
          {!done && ` · ${STATUS_TEXT[run.status] ?? run.status}`}
        </div>
      </td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">
        {run.presetName ?? '—'}
        {run.provisional &&
        <span className="ml-2 bg-warning/15 text-warning text-[10px] font-bold px-1.5 py-0.5 rounded">Provisional</span>
        }
      </td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">
        {run.datasetName ? `${run.datasetName} v${run.datasetVersion}` : '—'}
      </td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{run.packageName ?? 'No interventions'}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary tabular-nums">{run.monteCarloRuns}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary whitespace-nowrap">{formatDate(run.completedAt ?? run.queuedAt)}</td>
      <td className="px-4 py-3 text-[13px] text-text-secondary">{run.requestedBy}</td>
    </tr>);

}

interface BodyProps {
  cmp: Comparison | undefined;
  loading: boolean;
  error: string | null;
  selected: string[];
  baselineId: string | null;
  onBaseline: (id: string) => void;
  capacityId: string | null;
  onCapacity: (id: string | null) => void;
  options: {id: string;name: string;hospitalBeds: number;placeholder: boolean;}[];
  view: 'active' | 'beds';
  onView: (v: 'active' | 'beds') => void;
  colorOf: (id: string) => string;
}

function ComparisonBody({ cmp, loading, error, baselineId, onBaseline, capacityId, onCapacity, options, view, onView, colorOf }: BodyProps) {
  if (error) {
    return <div className="bg-danger/10 border border-danger/30 text-danger text-[13px] rounded-xl p-4">{error}</div>;
  }
  if (loading || !cmp) {
    return <div className="bg-surface p-6 rounded-xl border border-border text-[13px] text-text-secondary">Comparing runs…</div>;
  }
  const beds = cmp.runs[0]?.capacity?.beds;
  const chartSeries = cmp.runs.map((r) => ({
    key: r.id.replace(/[^A-Za-z0-9]/g, ''),
    label: `${r.scenarioName ?? r.id}${r.id === cmp.baselineId ? ' (baseline)' : ''}`,
    color: colorOf(r.id),
    data: toBands(view === 'active' ? r.series.active : r.series.hospitalised)
  }));

  return (
    <div className="space-y-6">
      {/* Baseline + capacity */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <label className="block text-micro text-text-secondary mb-2">BASELINE</label>
          <div className="flex flex-wrap gap-2">
            {cmp.runs.map((r) =>
            <button
              key={r.id}
              onClick={() => onBaseline(r.id)}
              aria-pressed={r.id === baselineId}
              className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold flex items-center gap-2 transition-colors ${
              r.id === baselineId ? 'border-primary bg-hover text-text-primary' : 'border-border text-text-secondary hover:bg-background'}`
              }>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: colorOf(r.id) }} />
                {r.scenarioName ?? r.id}
                {r.id === baselineId && <Check size={13} className="text-primary" />}
              </button>
            )}
          </div>
          <p className="text-[11px] text-text-secondary mt-2">Other runs show their difference from the baseline.</p>
        </div>
        <div>
          <label htmlFor="cmp-capacity" className="block text-micro text-text-secondary mb-2">CAPACITY PROFILE (APPLIES TO EVERY RUN)</label>
          <select
            id="cmp-capacity"
            value={capacityId ?? ''}
            onChange={(e) => onCapacity(e.target.value || null)}
            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
            <option value="">No capacity check</option>
            {options.map((o) =>
            <option key={o.id} value={o.id}>
                {o.name} · {o.hospitalBeds.toLocaleString()} beds{o.placeholder ? ' (illustrative)' : ''}
              </option>
            )}
          </select>
          <p className="text-[11px] text-text-secondary mt-2">Capacity is a check on the results, not an input to the model.</p>
        </div>
      </div>

      {/* Fairness warnings */}
      {(cmp.warnings.length > 0 || cmp.provisional) &&
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-4 space-y-1">
          {cmp.warnings.map((w) =>
        <p key={w} className="flex items-start gap-2 text-[13px] text-text-primary">
              <AlertTriangle size={15} className="text-warning mt-0.5 flex-shrink-0" />
              {w}
            </p>
        )}
          {cmp.provisional &&
        <p className="flex items-start gap-2 text-[13px] text-text-primary">
              <AlertTriangle size={15} className="text-warning mt-0.5 flex-shrink-0" />
              At least one run uses a provisional disease preset (values not yet reviewed by an epidemiologist).
            </p>
        }
        </div>
      }

      {/* What is different */}
      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-h3 text-text-primary">What is different between these runs</h3>
        </div>
        {cmp.differences.length === 0 ?
        <p className="px-6 py-5 text-[13px] text-text-secondary">These runs use the same settings.</p> :

        <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-background border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-micro text-text-secondary">SETTING</th>
                  {cmp.runs.map((r) =>
                <th key={r.id} className="px-6 py-3 text-micro" style={{ color: colorOf(r.id) }}>
                      {(r.scenarioName ?? r.id).toUpperCase()}
                    </th>
                )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {cmp.differences.map((d) =>
              <tr key={d.setting}>
                    <td className="px-6 py-3 text-[13px] font-medium text-text-primary">{d.setting}</td>
                    {d.values.map((v, i) =>
                <td key={i} className="px-6 py-3 text-[13px] text-text-secondary">{v}</td>
                )}
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </section>

      {/* Chart */}
      <section className="bg-surface p-6 rounded-xl border border-border">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="text-h3 text-text-primary">{view === 'active' ? 'Active cases' : 'Beds needed'}</h3>
            <p className="text-[12px] text-text-secondary mt-1">
              Line: median of runs. Shaded: 5–95% of runs. {cmp.label}.
            </p>
          </div>
          <div role="radiogroup" aria-label="Chart" className="flex rounded-full bg-surface-2 p-1">
            {([['active', 'Active cases'], ['beds', 'Beds needed']] as const).map(([id, label]) =>
            <button
              key={id}
              role="radio"
              aria-checked={view === id}
              onClick={() => onView(id)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold whitespace-nowrap transition-colors ${
              view === id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`
              }>
                {label}
              </button>
            )}
          </div>
        </div>
        <FanChart
          series={chartSeries}
          height={300}
          threshold={view === 'beds' && beds !== undefined ? beds : undefined}
          thresholdLabel={view === 'beds' && beds !== undefined ? `${beds.toLocaleString()} beds available` : undefined} />
        {view === 'beds' && beds === undefined &&
        <p className="text-[12px] text-text-secondary mt-2">Choose a capacity profile to draw the beds line.</p>
        }
      </section>

      {/* Results table */}
      <section className="bg-surface rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-background border-b border-border">
            <tr className="text-left text-[12px] text-text-secondary">
              <th className="px-6 py-3 font-semibold">Median (5–95% range)</th>
              {cmp.runs.map((r) =>
              <th key={r.id} className="px-6 py-3 font-semibold">
                  <span className="flex items-center gap-2 text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: colorOf(r.id) }} />
                    <span className="truncate max-w-[200px]">{r.scenarioName ?? r.id}</span>
                    {r.id === cmp.baselineId && <span className="text-[10px] font-bold text-text-secondary">BASELINE</span>}
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {cmp.results.map((row) =>
            <tr key={row.metric}>
                <td className="px-6 py-3 text-text-secondary">{row.label}</td>
                {row.values.map((v) => {
                const cell = fmtCell(row.metric, v.value);
                const needsCapacity = row.metric === 'pBedsExceeded' && v.value === null;
                return (
                  <td key={v.runId} className="px-6 py-3">
                      <div className="font-semibold text-text-primary tabular-nums">
                        {needsCapacity ? 'Pick a capacity profile' : cell.main}
                        {v.diff !== null && v.diff !== 0 &&
                      <span className={`ml-2 text-[11px] font-bold ${v.better ? 'text-success' : 'text-danger'}`}>
                            {fmtDiff(row.metric, v.diff)}
                          </span>
                      }
                      </div>
                      {!needsCapacity && <div className="text-[11px] text-text-secondary tabular-nums">{cell.sub}</div>}
                    </td>);

              })}
              </tr>
            )}
            {cmp.runs[0]?.capacity &&
            <tr>
                <td className="px-6 py-3 text-text-secondary">Beds run out (median course)</td>
                {cmp.runs.map((r) =>
              <td key={r.id} className="px-6 py-3 font-semibold text-text-primary">
                    {r.capacity?.bedsRunOutDay != null ? `From day ${r.capacity.bedsRunOutDay}` : 'Within capacity'}
                  </td>
              )}
              </tr>
            }
          </tbody>
        </table>
        <p className="px-6 py-3 border-t border-border text-[11px] text-text-secondary">
          {cmp.label}. Green means better than the baseline, red worse. Ranges show chance variation between runs, not uncertainty about the disease parameters.
        </p>
      </section>
    </div>);

}
