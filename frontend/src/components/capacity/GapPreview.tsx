import { AlertTriangle } from 'lucide-react';
import { CapacityDraft } from '../../types/capacity';
import { fmt, parseWhole } from '../../utils/capacity';

/** An invented outbreak peak, only to show how the check reads. Real checks use completed runs. */
const EXAMPLE_PEAK = { hospitalBeds: 310, icuBeds: 22, testsPerDay: 260 };

const ROWS: {key: keyof typeof EXAMPLE_PEAK;label: string;unit: string;}[] = [
{ key: 'hospitalBeds', label: 'Hospital beds', unit: 'beds' },
{ key: 'icuBeds', label: 'ICU beds', unit: 'beds' },
{ key: 'testsPerDay', label: 'Daily testing', unit: 'tests/day' }];


export function GapPreview({ draft }: {draft: CapacityDraft;}) {
  return (
    <section className="bg-surface rounded-xl border border-border p-6" aria-labelledby="gap-title">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 id="gap-title" className="text-h3 text-text-primary">How this profile will be used</h3>
        <span className="text-[12px] text-text-secondary">Illustrative example, not a simulation result. Real checks appear on run results, Scenario Comparison and Geographic Spread</span>
      </div>
      <p className="text-[13px] text-text-secondary mt-1">
        Each simulation’s projected peak is checked against these numbers. Here is one example outbreak.
      </p>

      <div className="mt-5 space-y-5">
        {ROWS.map((r) => {
          const cap = parseWhole(draft[r.key]);
          const peak = EXAMPLE_PEAK[r.key];
          const known = !Number.isNaN(cap) && cap >= 0;
          const over = known && peak > cap;
          const scale = Math.max(peak, known ? cap : 0) * 1.15 || 1;
          const peakPct = peak / scale * 100;
          const capPct = known ? cap / scale * 100 : 0;
          return (
            <div key={r.key}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-[13px] font-medium text-text-primary">{r.label}</span>
                {!known ?
                <span className="text-[12px] text-text-secondary">Enter a capacity to compare</span> :
                over ?
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-danger/15 text-danger text-[11px] font-semibold">
                    <AlertTriangle size={12} /> Over capacity
                  </span> :

                <span className="px-2 py-0.5 rounded-full bg-success/15 text-success text-[11px] font-semibold">Within capacity</span>
                }
              </div>
              <div className="relative h-3 rounded-full bg-surface-2" role="img" aria-label={`${r.label}: example peak ${fmt(peak)} ${r.unit}, capacity ${known ? fmt(cap) : 'not set'}`}>
                <div
                  className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-200 ease-out ${over ? 'bg-danger' : 'bg-primary'}`}
                  style={{ width: `${peakPct}%` }} />
                
                {known &&
                <div className="absolute -top-1 -bottom-1 w-0.5 bg-text-primary transition-[left] duration-200 ease-out" style={{ left: `${capPct}%` }} aria-hidden />
                }
              </div>
              <div className="flex justify-between text-[12px] text-text-secondary mt-1.5 tabular-nums">
                <span>Example peak {fmt(peak)} {r.unit}</span>
                <span>Capacity {known ? fmt(cap) : '—'}</span>
              </div>
            </div>);

        })}
      </div>
    </section>);

}