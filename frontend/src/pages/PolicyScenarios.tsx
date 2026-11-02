import React, { useMemo, useState } from 'react';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { FanChart } from '../components/models/FanChart';
import { CHART } from '../components/models/chartTheme';
import { approvedScenarios } from '../data/approvedScenarios';
import { getDisease } from '../lib/models/diseases';
import { bedsRange, casesRange, inTen, plainSummary, resultFor } from '../utils/approvedScenarioResults';

const COLORS = [CHART.accent, CHART.primary, CHART.blue];
const MAX = 3;

export function PolicyScenarios() {
  const [selected, setSelected] = useState<string[]>(['APS-01', 'APS-02', 'APS-04']);
  const chosen = selected.map((id) => approvedScenarios.find((s) => s.id === id)!).filter(Boolean);
  const results = useMemo(() => chosen.map((s) => resultFor(s)), [selected.join(',')]);

  const toggle = (id: string) =>
  setSelected((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : sel.length < MAX ? [...sel, id] : sel);

  const deathsRange = (i: number) => `${Math.round(results[i].finalDeaths.low)} to ${Math.round(results[i].finalDeaths.high)}`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Scenario Comparison</h1>
          <ViewOnlyBadge />
        </div>
        <p className="text-body text-text-secondary">
          Approved scenarios only. Pick up to three to see what each plan could mean. Numbers are ranges, not exact predictions.
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose scenarios to compare">
        {approvedScenarios.map((s) => {
          const on = selected.includes(s.id);
          const blocked = !on && selected.length >= MAX;
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
            {chosen.map((s, i) =>
          <article key={s.id} className="bg-surface rounded-xl border border-border p-5 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                  <h2 className="text-[15px] font-semibold text-text-primary">{s.name}</h2>
                </div>
                <p className="text-[12px] text-text-secondary mt-1">
                  {getDisease(s.diseaseId).name} · approved {s.approvedOn}
                </p>
                <p className="text-[13px] text-text-primary mt-3">{s.plan}</p>
                <p className="text-[13px] text-text-secondary mt-3 leading-relaxed">{plainSummary(s, results[i])}</p>
                <dl className="mt-auto pt-4 divide-y divide-border border-t border-border text-[13px]">
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-text-secondary">Total cases</dt>
                    <dd className="font-semibold text-text-primary text-right">{casesRange(results[i])}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-text-secondary">Deaths</dt>
                    <dd className="font-semibold text-text-primary text-right">{deathsRange(i)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-text-secondary">Beds needed</dt>
                    <dd className="font-semibold text-text-primary text-right">{bedsRange(results[i])} of {s.isolationBeds}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-2.5">
                    <dt className="text-text-secondary">Beds run short</dt>
                    <dd className="font-semibold text-text-primary text-right">{inTen(results[i].pBedsExceeded)} runs</dd>
                  </div>
                </dl>
              </article>
          )}
          </div>

          <section className="bg-surface p-6 rounded-xl border border-border">
            <h2 className="text-h3 text-text-primary">People sick at the same time</h2>
            <p className="text-[12px] text-text-secondary mt-1 mb-4">
              The line is the most likely path. The shaded area shows the range of possible outcomes.
            </p>
            <FanChart
            series={chosen.map((s, i) => ({ key: `p${i}`, label: s.name, color: COLORS[i], data: results[i].active }))}
            height={300} />
          
          </section>
        </>
      }
    </div>);

}