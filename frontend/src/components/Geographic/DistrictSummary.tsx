import React from 'react';
import { GeoState } from '../../hooks/useGeographicSpread';
import { fmt } from '../../utils/geographicSpread';

export function DistrictSummary({ g }: {g: GeoState;}) {
  const p = g.selected;
  const base = g.baseline;
  const H = g.scenario.horizon;
  const reached = p.arrival !== null;
  const rd = g.responseDay;
  const planned = rd < H;

  const stats = [
  { label: 'Projected cases', value: reached ? fmt(p.totalCases) : '0' },
  { label: 'Peak day', value: reached ? `Day ${p.peakDay}` : '—' },
  { label: 'Bed demand', value: reached ? fmt(p.peakBedDemand) : '0' },
  { label: 'Beds available', value: fmt(p.beds) }];


  const result = () => {
    if (!planned) return 'Move the slider to test an earlier response.';
    const fewer = Math.round(base.totalCases - p.totalCases);
    const cases = fewer > 0 ? `Projected cases ${fmt(fewer)} lower` : 'Little change in cases';
    if (base.overCapacityDay !== null && p.overCapacityDay === null) return `${cases}, bed gap closes.`;
    if (p.overCapacityDay !== null) {
      const saved = base.overCapacityDays - p.overCapacityDays;
      return `${cases}, still over capacity${saved > 0 ? ` (${saved} fewer days)` : ''}.`;
    }
    return `${cases}, stays within capacity.`;
  };

  return (
    <section aria-label={`${p.district.name} summary`} className="rounded-2xl bg-background p-5">
      <h2 className="text-h3 text-text-primary">{p.district.name}</h2>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
        {stats.map((s) =>
        <div key={s.label}>
            <dt className="text-[12px] text-text-secondary">{s.label}</dt>
            <dd className="text-[22px] font-bold text-text-primary tabular-nums leading-tight mt-0.5">{s.value}</dd>
          </div>
        )}
      </dl>

      <p className={`mt-4 text-[14px] font-semibold ${p.overCapacityDay !== null ? 'text-danger' : 'text-[#047857]'}`}>
        {p.overCapacityDay !== null ? `Over capacity from day ${p.overCapacityDay}` : reached ? 'Within capacity' : `No cases projected within ${H} days`}
      </p>

      {reached &&
      <div className="mt-5 pt-5 border-t border-border">
          <div className="flex items-baseline justify-between gap-3">
            <label htmlFor="geo-response" className="text-[14px] font-medium text-text-primary">Start response on day</label>
            <span className="text-[14px] font-semibold text-text-primary tabular-nums">{planned ? `Day ${rd}` : 'Not planned'}</span>
          </div>
          <input
          id="geo-response"
          type="range"
          min={p.arrival ?? 0}
          max={H}
          value={rd}
          onChange={(e) => g.setResponseDay(p.district.id, Number(e.target.value))}
          className="w-full mt-2 accent-[#12A594] cursor-pointer" />
        
          <p className="text-[14px] text-text-secondary mt-1">{result()}</p>
        </div>
      }
    </section>);

}