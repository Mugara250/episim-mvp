import { ReactNode, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  BedDouble,
  Check,
  FileText,
  GitCompare,
  Info,
  Link2,
  Loader2,
  Map as MapIcon,
  Skull,
  Stethoscope,
  TrendingUp,
  Users } from
'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getAccessLevel, hasAccess } from '../lib/rbac';
import { useCapacityOptions, useRun, useRunList, useRunResults, useRunRt, useRunSeries } from '../api/simulations';
import { FanChart } from '../components/models/FanChart';
import { CHART, pct, round } from '../components/models/chartTheme';
import { Range, RunResults as Results, SeriesKey, SimulationRun, toBands } from '../types/simulationRuns';
import { formatStarted, MODEL_LABELS, STATUS_LABELS } from '../utils/simulationRuns';

// Results dashboard for one completed run (Modules 6, 11, 15, 16). It reuses the layout of the
// prototype's "Epidemic Intelligence Dashboard" (tile row, analysis column, right sidebar) with real
// engine output only. Capacity is chosen here, at analysis time, never stored on the run.

const CHARTS: {key: SeriesKey;label: string;color: string;help: string;}[] = [
{ key: 'active', label: 'Active cases', color: CHART.primary, help: 'People infectious in the community or in hospital (I + H).' },
{ key: 'hospitalised', label: 'Beds needed', color: CHART.accent, help: 'People in hospital each day. The dashed line is the beds in the chosen capacity profile.' },
{ key: 'cumulative', label: 'Total cases', color: CHART.blue, help: 'Cumulative cases since day 0.' },
{ key: 'deaths', label: 'Deaths', color: CHART.danger, help: 'Cumulative deaths since day 0.' }];


const rangeText = (r: Range, fmt: (n: number) => string = round) => `5–95%: ${fmt(r.low)}–${fmt(r.high)}`;

function Tile({ icon: Icon, label, value, detail, tone = 'text-text-primary' }: {icon: typeof Activity;label: string;value: string;detail: string;tone?: string;}) {
  return (
    <div className="bg-surface p-4 rounded-xl border border-border shadow-sm">
      <div className="text-micro text-text-secondary mb-1 flex items-center">
        <Icon size={12} className="mr-1" /> {label.toUpperCase()}
      </div>
      <div className={`text-h2 ${tone}`}>{value}</div>
      <div className="text-[11px] text-text-secondary mt-1">{detail}</div>
    </div>);

}

function Panel({ title, children }: {title: string;children: ReactNode;}) {
  return (
    <section className="bg-surface rounded-xl border border-border p-5">
      <h2 className="text-[14px] font-semibold text-text-primary mb-3">{title}</h2>
      {children}
    </section>);

}

function Fact({ label, children }: {label: string;children: ReactNode;}) {
  return (
    <div className="flex justify-between gap-3 py-1.5 text-[12px]">
      <dt className="text-text-secondary">{label}</dt>
      <dd className="text-text-primary text-right font-medium min-w-0 break-words">{children}</dd>
    </div>);

}

function CapacityPanel({ results, capacityId, setCapacityId }: {results: Results;capacityId: string | null;setCapacityId: (id: string | null) => void;}) {
  const options = useCapacityOptions();
  const cap = results.capacity;
  return (
    <Panel title="Capacity check">
      <label htmlFor="cap-profile" className="block text-[12px] text-text-secondary mb-1.5">Capacity profile</label>
      <select
        id="cap-profile"
        value={capacityId ?? ''}
        onChange={(e) => setCapacityId(e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">

        <option value="">{options.isLoading ? 'Loading profiles…' : 'Choose a profile'}</option>
        {(options.data ?? []).map((o) =>
        <option key={o.id} value={o.id}>{o.name} · {o.hospitalBeds.toLocaleString()} beds</option>
        )}
      </select>
      {options.error && <p className="text-[12px] text-danger mt-2">{options.error.message}</p>}
      {cap ?
      <div className="mt-4 space-y-3">
          <div
          className={`rounded-lg border px-3 py-2.5 text-[13px] flex items-start gap-2 ${
          cap.bedsRunOutDay !== null ? 'border-danger/30 bg-danger/5' : 'border-success/30 bg-success/5'}`
          }>

            {cap.bedsRunOutDay !== null ?
          <AlertTriangle size={15} className="text-danger mt-0.5 flex-shrink-0" /> :
          <Check size={15} className="text-success mt-0.5 flex-shrink-0" />
          }
            <span className="text-text-primary">
              {cap.bedsRunOutDay !== null ?
            <>Beds run out from day {cap.bedsRunOutDay} (median).</> :
            <>Within capacity at the median.</>
            }
              {cap.bedsRunOutDay === null && cap.bedsRunOutDayHigh !== null &&
            <span className="block text-[12px] text-text-secondary">In the worst 5% of runs, beds run out from day {cap.bedsRunOutDayHigh}.</span>
            }
            </span>
          </div>
          <dl className="divide-y divide-border">
            <Fact label="Beds available">{cap.beds.toLocaleString()}</Fact>
            <Fact label="Chance beds run out">{pct(cap.pBedsExceeded)}</Fact>
            <Fact label="Peak beds needed">{round(results.summary.peakBeds.median)} ({round(results.summary.peakBeds.low)}–{round(results.summary.peakBeds.high)})</Fact>
          </dl>
          {cap.placeholder && <p className="text-[11px] text-warning">This profile holds illustrative bed numbers.</p>}
        </div> :

      <p className="text-[12px] text-text-secondary mt-3">Pick a profile to check bed demand against it. Capacity is applied when you analyse, not when you run.</p>
      }
    </Panel>);

}

function InputsPanel({ results, run }: {results: Results;run: SimulationRun;}) {
  const i = results.inputs;
  return (
    <Panel title="What this run used">
      <dl className="divide-y divide-border">
        <Fact label="Model">{MODEL_LABELS[i.modelType]}</Fact>
        <Fact label="Monte Carlo runs">{i.monteCarloRuns}</Fact>
        <Fact label="Seed">{i.seed}</Fact>
        <Fact label="Engine">{i.engineVersion}</Fact>
        <Fact label="Horizon">{i.horizonDays} days</Fact>
        <Fact label="Initial cases">{i.initialCases}</Fact>
        <Fact label="Population">
          {i.population.datasetName} v{i.population.datasetVersion}
          {i.population.illustrative && <span className="block text-[11px] text-warning">Illustrative</span>}
        </Fact>
        <Fact label="Disease">
          {i.disease.name} (preset v{i.disease.presetVersion}, R0 {i.disease.r0})
          {i.disease.provisional && <span className="block text-[11px] text-warning">Provisional</span>}
        </Fact>
        <Fact label="Interventions">{i.interventions.packageName ?? 'None (baseline response)'}</Fact>
        <Fact label="Requested">{run.requestedBy} · {formatStarted(run.startedAt)}</Fact>
      </dl>
      {i.interventions.items.length > 0 &&
      <ul className="mt-2 space-y-1">
          {i.interventions.items.map((it, n) =>
        <li key={n} className="text-[11px] text-text-secondary">
              {it.type_name ?? it.type_key}: day {it.start_day}{it.end_day == null ? ' onward' : `–${it.end_day}`}, effect {pct(it.effect)}
            </li>
        )}
        </ul>
      }
      <p className="text-[11px] text-text-secondary mt-3">
        <span className="font-semibold">Disease reference:</span> {i.disease.reference}
      </p>
    </Panel>);

}

function RtChart({ runId }: {runId: string;}) {
  const rt = useRunRt(runId);
  const rows = (rt.data?.points ?? []).map((p) => ({
    day: p.day,
    rt: p.rt === null ? null : Number(p.rt.toFixed(2)),
    band: p.low === null || p.high === null ? null : [Number(p.low.toFixed(2)), Number(Math.min(p.high, 6).toFixed(2))]
  }));
  return (
    <section className="bg-surface p-6 rounded-xl border border-border">
      <h2 className="text-h3 text-text-primary">Rt over the run</h2>
      <p className="text-[12px] text-text-secondary mt-1 mb-4">
        Rt estimated (Cori method) from the median daily new cases of this run. Above the dashed line the outbreak grows.
      </p>
      {rt.isLoading ?
      <p className="text-[13px] text-text-secondary">Loading…</p> :
      rt.error ?
      <p className="text-[13px] text-danger">{rt.error.message}</p> :

      <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 12, left: -8, bottom: 0 }}>
              <CartesianGrid stroke={CHART.grid} vertical={false} />
              <XAxis dataKey="day" tick={CHART.tick} axisLine={false} tickLine={false} tickFormatter={(d) => `Day ${d}`} minTickGap={40} />
              <YAxis tick={CHART.tick} axisLine={false} tickLine={false} width={36} domain={[0, 'auto']} />
              <Tooltip
              contentStyle={CHART.tooltip}
              labelFormatter={(d) => `Day ${d}`}
              formatter={(v, key) => key === 'band' ? [Array.isArray(v) ? `${v[0]}–${v[1]}` : '—', 'Rt 95% range'] : [v ?? '—', 'Rt']} />

              <ReferenceLine y={1} stroke={CHART.danger} strokeDasharray="4 4" />
              <Area dataKey="band" stroke="none" fill={CHART.primary} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
              <Line dataKey="rt" stroke={CHART.primary} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      }
    </section>);

}

/** The dashboard body for a run; used by /simulation/runs/:runId and the role-default dashboard. */
export function RunDashboard({ runId }: {runId: string;}) {
  const navigate = useNavigate();
  const { role } = useAuth();
  const [params, setParams] = useSearchParams();
  const capacityId = params.get('capacity');
  const setCapacityId = (id: string | null) =>
  setParams((p) => {
    const next = new URLSearchParams(p);
    if (id) next.set('capacity', id);else
    next.delete('capacity');
    return next;
  }, { replace: true });
  const [chart, setChart] = useState<SeriesKey>('active');
  const [copied, setCopied] = useState(false);

  const runQ = useRun(runId);
  const run = runQ.data;
  const done = run?.status === 'completed';
  const results = useRunResults(runId, capacityId, done);
  const series = useRunSeries(runId, done);
  const r = results.data;
  const s = series.data?.series;
  const fan = useMemo(() => toBands(s?.[chart]), [s, chart]);
  const meta = CHARTS.find((c) => c.key === chart)!;

  if (runQ.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-text-secondary">
        <Loader2 size={16} className="animate-spin" /> Loading run {runId}…
      </div>);

  }
  if (runQ.error || !run) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 text-center">
        <h2 className="text-h3 text-text-primary">Run not available</h2>
        <p className="text-[13px] text-text-secondary mt-1">{runQ.error?.message ?? `We couldn’t find ${runId}.`}</p>
        <Link to="/simulation?tab=history" className="inline-block mt-4 text-[13px] font-semibold text-primary hover:underline">Go to run history</Link>
      </div>);

  }
  if (!done) {
    return (
      <div className="bg-surface rounded-xl border border-border p-10 text-center">
        <h2 className="text-h3 text-text-primary">{run.scenarioName}</h2>
        <p className="text-[13px] text-text-secondary mt-1">
          This run is {STATUS_LABELS[run.status].toLowerCase()}. Results are shown once it completes.
          {run.status === 'failed' && run.error ? ` ${run.error}` : ''}
        </p>
        <Link to={`/simulation?run=${run.id}`} className="inline-block mt-4 text-[13px] font-semibold text-primary hover:underline">Follow it on Simulations</Link>
      </div>);

  }

  const copyLink = () => {
    try {
      void navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked: the address bar still holds the link.
    }
  };
  const btn = 'px-3 py-2 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors flex items-center gap-2';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="min-w-0">
          <h1 className="text-h1 text-text-primary mb-1">{run.scenarioName}</h1>
          <p className="text-body text-text-secondary">
            {run.id} · {run.presetName}
            {run.provisional && <span className="ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning align-middle">Provisional</span>}
            {' '}· {MODEL_LABELS[run.modelType]} · {run.horizonDays} days · {run.monteCarloRuns} runs
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasAccess(role, 'scenario') &&
          <button onClick={() => navigate(`/scenario?runs=${run.id}${capacityId ? `&capacity=${capacityId}` : ''}`)} className={btn}>
              <GitCompare size={15} /> Compare
            </button>
          }
          {run.modelType === 'seihfr_geo' && hasAccess(role, 'geographic') &&
          <button onClick={() => navigate(`/geographic?run=${run.id}${capacityId ? `&capacity=${capacityId}` : ''}`)} className={btn}>
              <MapIcon size={15} /> Map
            </button>
          }
          {getAccessLevel(role, 'reports') === 'full' &&
          <button onClick={() => navigate(`/reports?run=${run.id}`)} className={btn}>
              <FileText size={15} /> Add to report
            </button>
          }
          <button onClick={copyLink} className={btn}>
            {copied ? <Check size={15} /> : <Link2 size={15} />} {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>

      <p className="flex items-start gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-[13px] text-text-primary">
        <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
        <span>
          <span className="font-semibold">{r?.label ?? 'Scenario estimates, not forecasts'}.</span>{' '}
          Each figure is the median of {run.monteCarloRuns} simulated outbreaks, with the 5–95% range. {r?.notes.slice(1).join(' ')}
        </span>
      </p>

      {results.error && <p className="text-[13px] text-danger">Results couldn’t be loaded: {results.error.message}</p>}
      {r &&
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Tile icon={TrendingUp} label="Chance it takes off" value={pct(r.summary.pTakeOff)} detail={`Over 100 cases: ${pct(r.summary.pOver100)}`} tone={r.summary.pTakeOff > 0.5 ? 'text-danger' : 'text-text-primary'} />
          <Tile icon={Users} label="Total cases" value={round(r.summary.finalCases.median)} detail={rangeText(r.summary.finalCases)} />
          <Tile icon={Skull} label="Deaths" value={round(r.summary.finalDeaths.median)} detail={rangeText(r.summary.finalDeaths)} />
          <Tile icon={BedDouble} label="Peak beds needed" value={round(r.summary.peakBeds.median)} detail={rangeText(r.summary.peakBeds)} />
          <Tile
          icon={AlertTriangle}
          label="Chance beds run out"
          value={r.capacity ? pct(r.capacity.pBedsExceeded) : '—'}
          detail={r.capacity ? `${r.capacity.beds.toLocaleString()} beds · ${r.capacity.profileName}` : 'Choose a capacity profile'}
          tone={r.capacity && r.capacity.pBedsExceeded > 0.2 ? 'text-danger' : 'text-text-primary'} />

          <Tile icon={Stethoscope} label="Health-worker share" value={pct(r.summary.hcwShare.median)} detail={rangeText(r.summary.hcwShare, (v) => pct(v))} />
        </div>
      }

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="space-y-6 min-w-0">
          <section className="bg-surface p-6 rounded-xl border border-border">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-h3 text-text-primary">Epidemic trajectory</h2>
                <p className="text-[12px] text-text-secondary mt-1">{meta.help}</p>
              </div>
              <div role="tablist" className="flex flex-wrap gap-1 p-1 rounded-lg bg-background border border-border">
                {CHARTS.map((c) =>
                <button
                  key={c.key}
                  role="tab"
                  aria-selected={chart === c.key}
                  onClick={() => setChart(c.key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  chart === c.key ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`
                  }>

                    {c.label}
                  </button>
                )}
              </div>
            </div>
            {series.isLoading ?
            <p className="text-[13px] text-text-secondary py-16 text-center">Loading chart…</p> :
            series.error ?
            <p className="text-[13px] text-danger">{series.error.message}</p> :

            <FanChart
              series={[{ key: chart, label: meta.label, color: meta.color, data: fan }]}
              threshold={chart === 'hospitalised' && r?.capacity ? r.capacity.beds : undefined}
              thresholdLabel={r?.capacity ? `${r.capacity.beds.toLocaleString()} beds` : undefined}
              height={300} />

            }
          </section>

          <section className="bg-surface p-6 rounded-xl border border-border">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-h3 text-text-primary">Health-worker layer</h2>
                <p className="text-[12px] text-text-secondary mt-1">Cumulative infections among hospital staff and in the community.</p>
              </div>
              {hasAccess(role, 'hcw') &&
              <Link to={`/health-workers?run=${run.id}`} className="text-[13px] font-semibold text-primary hover:underline">Explore protection settings</Link>
              }
            </div>
            {s &&
            <FanChart
              series={[
              { key: 'hcw', label: 'Health workers', color: CHART.warning, data: toBands(s.hcw_cumulative) },
              { key: 'community', label: 'Community', color: CHART.primary, data: toBands(s.community_cumulative) }]
              }
              height={240} />

            }
          </section>

          <RtChart runId={run.id} />
        </div>

        <div className="space-y-5">
          {r && <CapacityPanel results={r} capacityId={capacityId} setCapacityId={setCapacityId} />}
          {r && <InputsPanel results={r} run={run} />}
          <Panel title="How to read this">
            <ul className="space-y-2 text-[12px] text-text-secondary">
              <li>Lines are the median of all simulated outbreaks; shading covers 90% of them.</li>
              <li>Chance it takes off is the share of runs that reach 20 or more cases.</li>
              <li>Parameters have not been calibrated against local data or reviewed by an epidemiologist.</li>
            </ul>
          </Panel>
        </div>
      </div>
    </div>);

}

export function RunResults() {
  const { runId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-12">
      <button
        onClick={() => navigate('/simulation?tab=history')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">

        <ArrowLeft size={16} />
        Back to Simulations
      </button>
      {runId && <RunDashboard runId={runId} />}
    </div>);

}

/** Latest completed run the user can see, for the role-default dashboard. */
export function useLatestCompletedRun() {
  const runs = useRunList();
  return { run: (runs.data ?? []).find((r) => r.status === 'completed') ?? null, isLoading: runs.isLoading, error: runs.error };
}
