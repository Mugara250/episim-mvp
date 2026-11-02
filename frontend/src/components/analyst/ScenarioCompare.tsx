import React from 'react';
import { GitCompare } from 'lucide-react';
import { FanChart } from '../models/FanChart';
import { CHART, pct, round } from '../models/chartTheme';
import { SavedScenario } from '../../types/analyst';

export const COMPARE_COLORS = [CHART.primary, CHART.accent, CHART.blue];

export function ScenarioCompare({ scenarios }: {scenarios: SavedScenario[];}) {
  if (scenarios.length < 2) {
    return (
      <section className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center">
        <span className="w-12 h-12 rounded-xl bg-hover text-primary flex items-center justify-center mb-4">
          <GitCompare size={22} />
        </span>
        <h2 className="text-h3 text-text-primary">Select two or three scenarios</h2>
        <p className="text-[13px] text-text-secondary mt-1 max-w-sm">Tick “Compare” on saved scenarios to see them side by side.</p>
      </section>);

  }

  const range = (v: {low: number;high: number;}) => `${round(v.low)}–${round(v.high)}`;
  const rows = [
  { label: 'Chance it takes off', get: (s: SavedScenario) => pct(s.result.pTakeOff), sub: () => 'share of runs' },
  { label: 'Total cases', get: (s: SavedScenario) => round(s.result.finalCases.median), sub: (s: SavedScenario) => range(s.result.finalCases) },
  { label: 'Deaths', get: (s: SavedScenario) => round(s.result.finalDeaths.median), sub: (s: SavedScenario) => range(s.result.finalDeaths) },
  { label: 'Peak beds needed', get: (s: SavedScenario) => round(s.result.peakBeds.median), sub: (s: SavedScenario) => `${range(s.result.peakBeds)} · ${s.settings.isolationBeds} available` },
  { label: 'Chance beds run out', get: (s: SavedScenario) => pct(s.result.pBedsExceeded), sub: () => 'share of runs' },
  { label: 'Health-worker share', get: (s: SavedScenario) => pct(s.result.hcwShare.median), sub: (s: SavedScenario) => `${pct(s.result.hcwShare.low)}–${pct(s.result.hcwShare.high)}` }];


  return (
    <div className="space-y-6">
      <section className="bg-surface p-6 rounded-xl border border-border">
        <h2 className="text-h3 text-text-primary">Active cases</h2>
        <p className="text-[12px] text-text-secondary mt-1 mb-4">Line: median of runs. Shaded: 5–95% of runs. These are scenario estimates, not forecasts.</p>
        <FanChart
          series={scenarios.map((s, i) => ({ key: `s${i}`, label: s.name, color: COMPARE_COLORS[i], data: s.result.active }))}
          height={300} />
        
      </section>

      <section className="bg-surface rounded-xl border border-border overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead className="bg-background border-b border-border">
            <tr className="text-left text-[12px] text-text-secondary">
              <th className="px-6 py-3 font-semibold">Median (5–95% range)</th>
              {scenarios.map((s, i) =>
              <th key={s.id} className="px-6 py-3 font-semibold">
                  <span className="flex items-center gap-2 text-text-primary">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COMPARE_COLORS[i] }} />
                    <span className="truncate max-w-[200px]">{s.name}</span>
                  </span>
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r) =>
            <tr key={r.label}>
                <td className="px-6 py-3 text-text-secondary">{r.label}</td>
                {scenarios.map((s) =>
              <td key={s.id} className="px-6 py-3">
                    <div className="font-semibold text-text-primary tabular-nums">{r.get(s)}</div>
                    <div className="text-[11px] text-text-secondary tabular-nums">{r.sub(s)}</div>
                  </td>
              )}
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>);

}