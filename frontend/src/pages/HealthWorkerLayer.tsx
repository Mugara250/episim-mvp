import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { Play, Loader2, Info, Eye } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { client, unwrap } from '../api/client';
import { hcwFromSnapshot, useHcwResults, useHcwWhatIf } from '../api/hcw';
import { useRunList, useStartRun } from '../api/simulations';
import { getAccessLevel } from '../lib/rbac';
import { SliderField, Stat } from '../components/models/Controls';
import { FanChart } from '../components/models/FanChart';
import { CHART, inputCls, labelCls, pct, round } from '../components/models/chartTheme';
import { HcwSettings, HcwWhatIf, toBands } from '../types/simulationRuns';
import { formatStarted } from '../utils/simulationRuns';

const RECOGNITION_DAYS = [7, 14, 21, 28];

export function HealthWorkerLayer({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { role } = useAuth();
  const canWrite = ['full', 'write'].includes(getAccessLevel(role, 'hcw'));
  const canRun = ['full', 'write'].includes(getAccessLevel(role, 'simulation'));
  const [params, setParams] = useSearchParams();
  const runs = useRunList();
  const completed = useMemo(() => (runs.data ?? []).filter((r) => r.status === 'completed'), [runs.data]);
  const runId = params.get('run') ?? completed[0]?.id ?? null;
  const run = completed.find((r) => r.id === runId) ?? null;
  const setRunId = (id: string) => setParams({ run: id });

  const results = useHcwResults(run ? run.id : null);
  const stored = hcwFromSnapshot(results.data?.settings);
  const [form, setForm] = useState<HcwSettings | null>(null);
  useEffect(() => setForm(stored), [results.data?.runId]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = <K extends keyof HcwSettings,>(k: K, v: HcwSettings[K]) => form && setForm({ ...form, [k]: v });
  const changed = !!form && !!stored && (Object.keys(form) as (keyof HcwSettings)[]).some((k) => form[k] !== stored[k]);

  const whatIf = useHcwWhatIf(run ? run.id : null);
  const [preview, setPreview] = useState<HcwWhatIf | null>(null);
  useEffect(() => setPreview(null), [run?.id]);
  const startRun = useStartRun();

  // "Why early recognition matters": the stored settings, recognised on different days (reduced runs).
  const timing = useQueries({
    queries: RECOGNITION_DAYS.map((day) => ({
      queryKey: ['simulations', run?.id ?? '', 'hcw-timing', day],
      enabled: !!run && canWrite,
      staleTime: Infinity,
      queryFn: async () =>
      unwrap(
        await client.POST('/api/simulations/{run_id}/health-workers/what-if', {
          params: { path: { run_id: run!.id } },
          body: { recognitionDay: day, pool: null, ppeBefore: null, ppeAfter: null }
        })
      ) as unknown as HcwWhatIf
    }))
  });

  const isMarburg = run?.disease === 'marburg';
  const r = results.data;

  const runPreview = () =>
  form && whatIf.mutate(form, { onSuccess: setPreview });
  const runFull = () =>
  run && form &&
  startRun.mutate(
    {
      scenarioId: run.scenarioId,
      horizonDays: run.horizonDays,
      initialCases: run.initialCases,
      modelType: run.modelType,
      seedDistrictCode: run.seedDistrictCode,
      hcw: form
    },
    { onSuccess: (created) => onNavigate?.(`/simulation?run=${created.id}`) }
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Health-Worker Layer</h1>
        <p className="text-body text-text-secondary">
          A small sub-model inside SEIHFR for infection among hospital staff — not a full agent-based model. Results are scenario estimates across many runs, shown with ranges.
        </p>
      </div>

      {isMarburg &&
      <p className="flex items-start gap-2 text-[13px] text-text-primary bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
          <Info size={16} className="text-warning mt-0.5 flex-shrink-0" />
          Important for Marburg: the preset’s reference records that about 80% of Rwanda’s 2024 cases were health workers. Confirm against the primary source before quoting.
        </p>
      }

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <div className="bg-surface p-6 rounded-xl border border-border space-y-5">
          <div>
            <label htmlFor="hcw-run" className={labelCls}>COMPLETED RUN</label>
            <select id="hcw-run" className={inputCls} value={run?.id ?? ''} onChange={(e) => setRunId(e.target.value)} disabled={!completed.length}>
              {!completed.length && <option value="">{runs.isLoading ? 'Loading runs…' : 'No completed runs yet'}</option>}
              {completed.map((x) =>
              <option key={x.id} value={x.id}>{x.id} · {x.scenarioName}</option>
              )}
            </select>
            {run &&
            <p className="text-[11px] text-text-secondary mt-1">
                {run.presetName}{run.provisional ? ' (provisional)' : ''} · {run.horizonDays} days · {formatStarted(run.startedAt)}
              </p>
            }
          </div>

          {form &&
          <>
              <div>
                <label htmlFor="hcw-pool" className="block text-micro text-text-secondary mb-2">HEALTH WORKERS IN THE AREA</label>
                <input id="hcw-pool" type="number" min={1} disabled={!canWrite} className={inputCls} value={form.pool} onChange={(e) => set('pool', Math.max(1, Number(e.target.value)))} />
              </div>
              <SliderField label="Protection before recognition" value={form.ppeBefore} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('ppeBefore', v)} hint="Gloves, gowns, masks and infection control used correctly." />
              <SliderField label="Protection after recognition" value={form.ppeAfter} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('ppeAfter', v)} />
              <SliderField label="Outbreak recognised on" value={form.recognitionDay} min={0} max={42} step={1} format={(v) => `Day ${v}`} onChange={(v) => set('recognitionDay', v)} />
              <p className="text-[12px] text-text-secondary">These start at the settings this run used. All defaults are placeholders.</p>
              {canWrite &&
            <button
              onClick={runPreview}
              disabled={whatIf.isPending || !changed}
              title={!changed ? 'Change a setting first' : undefined}
              className="w-full border border-border hover:border-primary/40 text-text-primary py-3 rounded-lg text-[13px] font-semibold flex items-center justify-center transition-colors disabled:opacity-50">

                  {whatIf.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Eye size={16} className="mr-2" />}
                  Preview with these settings
                </button>
            }
              {canRun &&
            <button
              onClick={runFull}
              disabled={startRun.isPending || !changed}
              className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-[13px] font-semibold flex items-center justify-center transition-colors disabled:opacity-60">

                  {startRun.isPending ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Play size={16} className="mr-2" />}
                  Start a full run with these settings
                </button>
            }
              {(whatIf.error || startRun.error) && <p className="text-[12px] text-danger">{(whatIf.error ?? startRun.error)?.message}</p>}
            </>
          }
        </div>

        <div className="space-y-6 min-w-0">
          {!run ?
          <div className="bg-surface rounded-xl border border-border p-10 text-center">
              <h2 className="text-h3 text-text-primary">No results yet</h2>
              <p className="text-[13px] text-text-secondary mt-1">Complete a simulation run, then come back to see how many cases are health workers.</p>
              {canRun && onNavigate &&
            <button onClick={() => onNavigate('/simulation')} className="mt-4 text-[13px] font-semibold text-primary hover:underline">Go to Simulations</button>
            }
            </div> :
          results.isLoading || !r ?
          <div className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">
              {results.error ? <span className="text-danger">{results.error.message}</span> : 'Loading results…'}
            </div> :

          <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat
                label="Cases that are health workers"
                value={pct(r.hcwShare.median)}
                detail={`5–95%: ${pct(r.hcwShare.low)}–${pct(r.hcwShare.high)}`}
                tone={r.hcwShare.median > 0.3 ? 'warning' : 'default'} />

                <Stat label="Health workers infected" value={round(r.hcwInfections.median)} detail={`5–95%: ${round(r.hcwInfections.low)}–${round(r.hcwInfections.high)} of ${stored?.pool ?? '—'} staff`} />
                <Stat
                label="Total cases"
                value={round(run.summary?.ranges?.finalCases.median ?? 0)}
                detail={run.summary?.ranges ? `5–95%: ${round(run.summary.ranges.finalCases.low)}–${round(run.summary.ranges.finalCases.high)}` : undefined} />

              </div>

              {preview &&
            <section className="bg-surface p-6 rounded-xl border border-primary/30">
                  <h2 className="text-h3 text-text-primary">Preview: with your settings</h2>
                  <p className="text-[12px] text-text-secondary mt-1 mb-4">
                    Preview from {preview.runs} runs, not saved. Start a full run to keep it.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-[13px]">
                    {[
                ['Health workers infected', preview.before.hcwInfections, preview.after.hcwInfections, round],
                ['Health-worker share', preview.before.hcwShare, preview.after.hcwShare, pct],
                ['Total cases', preview.before.finalCases, preview.after.finalCases, round]].
                map(([label, before, after, fmt]) => {
                  const f = fmt as (v: number) => string;
                  const b = before as typeof preview.before.hcwShare;
                  const a = after as typeof preview.before.hcwShare;
                  return (
                    <div key={label as string}>
                          <div className="text-micro text-text-secondary mb-1">{(label as string).toUpperCase()}</div>
                          <div className="text-text-primary">
                            <span className="text-text-secondary">{f(b.median)} → </span>
                            <span className="font-semibold">{f(a.median)}</span>
                          </div>
                          <div className="text-[11px] text-text-secondary">After: 5–95% {f(a.low)}–{f(a.high)}</div>
                        </div>);

                })}
                  </div>
                </section>
            }

              <section className="bg-surface p-6 rounded-xl border border-border">
                <h2 className="text-h3 text-text-primary">Health-worker vs community infections</h2>
                <p className="text-[12px] text-text-secondary mt-1 mb-4">
                  Cumulative infections. Full protection starts on day {stored?.recognitionDay ?? '—'}.
                </p>
                <FanChart
                series={[
                { key: 'hcw', label: 'Health workers', color: CHART.warning, data: toBands(r.series.hcwCumulative) },
                { key: 'community', label: 'Community', color: CHART.primary, data: toBands(r.series.communityCumulative) },
                ...(preview ? [{ key: 'preview', label: 'Health workers (preview)', color: CHART.accent, data: toBands(preview.after.hcwCumulative) }] : [])]
                }
                height={280} />

              </section>

              {canWrite &&
            <section className="bg-surface p-6 rounded-xl border border-border">
                  <h2 className="text-h3 text-text-primary">Why early recognition matters</h2>
                  <p className="text-[12px] text-text-secondary mt-1 mb-4">This run’s settings, recognised on different days (reduced runs each, median).</p>
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[12px] text-text-secondary border-b border-border">
                        <th className="py-2 font-semibold">Recognised on</th>
                        <th className="py-2 font-semibold">Health-worker share</th>
                        <th className="py-2 font-semibold text-right">Total cases</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {RECOGNITION_DAYS.map((day, i) => {
                    const t = timing[i]?.data?.after;
                    return (
                      <tr key={day}>
                            <td className="py-2.5 text-text-primary">Day {day}</td>
                            <td className="py-2.5">
                              {t ?
                          <div className="flex items-center gap-3">
                                  <div className="h-1.5 w-32 bg-background rounded-full overflow-hidden">
                                    <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, t.hcwShare.median * 100)}%` }} />
                                  </div>
                                  <span className="font-semibold text-text-primary tabular-nums">{pct(t.hcwShare.median)}</span>
                                </div> :
                          timing[i]?.error ?
                          <span className="text-danger text-[12px]">{timing[i].error?.message}</span> :

                          <Loader2 size={14} className="animate-spin text-text-secondary" />
                          }
                            </td>
                            <td className="py-2.5 text-right font-semibold text-text-primary tabular-nums">{t ? round(t.finalCases.median) : '—'}</td>
                          </tr>);

                  })}
                    </tbody>
                  </table>
                </section>
            }
              <p className="text-[12px] text-text-secondary">{r.label}. {r.notes.slice(1).join(' ')}</p>
            </>
          }
        </div>
      </div>
    </div>);

}
