import { useEffect, useState } from 'react';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { FanChart } from '../components/models/FanChart';
import { CHART } from '../components/models/chartTheme';
import { ApprovedScenario, inTen, rangeText, toDayBands, useApprovedScenarios, useRunResultsMany } from '../api/policy';
import { diseaseLabel, formatDate } from '../api/reports';

const COLORS = [CHART.accent, CHART.primary, CHART.blue];
const MAX = 3;

export function PolicyScenarios() {
  const approved = useApprovedScenarios();
  const all: ApprovedScenario[] = approved.data ?? [];
  const [selected, setSelected] = useState<string[] | null>(null);

  // Default: the first three approved scenarios, preferring those backed by a completed run.
  useEffect(() => {
    if (selected === null && all.length) {
      const ordered = [...all.filter((s) => s.runId), ...all.filter((s) => !s.runId)];
      setSelected(ordered.slice(0, MAX).map((s) => s.id));
    }
  }, [all, selected]);

  const sel = selected ?? [];
  const chosen = sel.map((id) => all.find((s) => s.id === id)).filter((s): s is ApprovedScenario => !!s);
  const runIds = chosen.map((s) => s.runId).filter((id): id is string => !!id);
  const { results, series } = useRunResultsMany(runIds);
  const resultFor = (s: ApprovedScenario) => s.runId ? results[runIds.indexOf(s.runId)] : undefined;
  const seriesFor = (s: ApprovedScenario) => s.runId ? series[runIds.indexOf(s.runId)] : undefined;

  const toggle = (id: string) =>
  setSelected((cur) => {
    const list = cur ?? [];
    return list.includes(id) ? list.filter((x) => x !== id) : list.length < MAX ? [...list, id] : list;
  });

  const fan = chosen.
  map((s, i) => ({ s, i, data: toDayBands(seriesFor(s)?.data?.series?.active) })).
  filter((x) => x.data.length > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Scenario Comparison</h1>
          <ViewOnlyBadge />
        </div>
        <p className="text-body text-text-secondary">
          Approved scenarios only. Pick up to three to see what each plan could mean. Numbers are ranges from many simulated runs:
          scenario estimates, not forecasts.
        </p>
      </div>

      {approved.isLoading ?
      <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">Loading approved scenarios…</p> :
      approved.isError ?
      <div className="bg-surface rounded-xl border border-border p-10 text-center text-[13px]">
          <p className="text-danger mb-2">Approved scenarios could not be loaded. {(approved.error as Error).message}</p>
          <button onClick={() => approved.refetch()} className="text-primary font-semibold hover:underline">Try again</button>
        </div> :
      all.length === 0 ?
      <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">
          No scenarios have been approved yet. Epidemiologists approve scenarios once they have been run.
        </p> :

      <>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Choose scenarios to compare">
            {all.map((s) => {
            const on = sel.includes(s.id);
            const blocked = !on && sel.length >= MAX;
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                disabled={blocked}
                aria-pressed={on}
                title={blocked ? 'You can compare up to three scenarios' : undefined}
                className={`px-3 py-2 rounded-lg border text-[13px] font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${on ? 'border-primary bg-hover text-primary' : 'border-border bg-surface text-text-secondary hover:border-primary/40 hover:text-text-primary'}`}>

                  {s.name}
                </button>);

          })}
          </div>

          {chosen.length === 0 ?
        <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">Choose at least one scenario above.</p> :

        <>
              <div className={`grid grid-cols-1 gap-4 ${chosen.length === 2 ? 'md:grid-cols-2' : chosen.length === 3 ? 'md:grid-cols-3' : ''}`}>
                {chosen.map((s, i) => {
              const q = resultFor(s);
              const r = q?.data;
              return (
                <article key={s.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                        <h2 className="text-[15px] font-semibold text-text-primary">{s.name}</h2>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <p className="text-[12px] text-text-secondary">
                          {diseaseLabel(s.disease)} · approved {formatDate(s.approvedOn)} by {s.approvedBy}
                        </p>
                        {(s.provisional || r?.provisional) &&
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Provisional</span>
                    }
                        {s.illustrative &&
                    <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">Illustrative</span>
                    }
                      </div>
                      <p className="text-[13px] text-text-primary mt-3">{s.plan}</p>
                      {!s.runId ?
                  <p className="text-[12px] text-text-secondary mt-auto pt-4 border-t border-border">
                          Sample approval from the prototype. No simulation run is attached, so no results are shown.
                        </p> :
                  q?.isLoading ?
                  <p className="text-[12px] text-text-secondary mt-auto pt-4">Loading results…</p> :
                  !r ?
                  <p className="text-[12px] text-danger mt-auto pt-4">Results for {s.runId} could not be loaded.</p> :

                  <dl className="mt-auto pt-4 divide-y divide-border border-t border-border text-[13px]">
                          <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-text-secondary">Chance it takes off</dt>
                            <dd className="font-semibold text-text-primary text-right">{inTen(r.summary.pTakeOff)} runs</dd>
                          </div>
                          <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-text-secondary">Total cases</dt>
                            <dd className="font-semibold text-text-primary text-right">{rangeText(r.summary.finalCases)}</dd>
                          </div>
                          <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-text-secondary">Deaths</dt>
                            <dd className="font-semibold text-text-primary text-right">{rangeText(r.summary.finalDeaths)}</dd>
                          </div>
                          <div className="flex justify-between gap-3 py-2.5">
                            <dt className="text-text-secondary">Beds needed</dt>
                            <dd className="font-semibold text-text-primary text-right">
                              {rangeText(r.summary.peakBeds)}
                              {r.capacity ? ` of ${r.capacity.beds}` : ''}
                            </dd>
                          </div>
                          {r.capacity &&
                    <div className="flex justify-between gap-3 py-2.5">
                              <dt className="text-text-secondary">Beds run short</dt>
                              <dd className="font-semibold text-text-primary text-right">{inTen(r.capacity.pBedsExceeded)} runs</dd>
                            </div>
                    }
                        </dl>
                  }
                    </article>);

            })}
              </div>

              <section className="bg-surface p-6 rounded-xl border border-border">
                <h2 className="text-h3 text-text-primary">People sick at the same time</h2>
                <p className="text-[12px] text-text-secondary mt-1 mb-4">
                  The line is the most likely path (median). The shaded area shows the 5–95% range across simulated runs.
                </p>
                {fan.length === 0 ?
            <p className="py-10 text-center text-[13px] text-text-secondary">None of the selected scenarios has run results to chart.</p> :

            <FanChart
              series={fan.map(({ s, i, data }) => ({ key: `p${i}`, label: s.name, color: COLORS[i], data }))}
              height={300} />

            }
                <p className="text-[11px] text-text-secondary mt-3">Scenario estimates, not forecasts.</p>
              </section>
            </>
        }
        </>
      }
    </div>);

}
