import React from 'react';
import { GeoState } from '../../hooks/useGeographicSpread';
import { DistrictBoundaries, GeoMetric } from '../../types/geographic';
import { BED_COLORS, legendFor, NO_CASES, SCALE } from '../../utils/geographicSpread';
import { DistrictChoropleth } from './DistrictChoropleth';
import { SpreadTimeline } from './SpreadTimeline';

const METRICS: {id: GeoMetric;label: string;}[] = [
{ id: 'cases', label: 'Cases' },
{ id: 'beds', label: 'Beds vs capacity' }];


export function GeoMapCard({ g, boundaries, svgRef }: {g: GeoState;boundaries: DistrictBoundaries;svgRef: React.RefObject<SVGSVGElement>;}) {
  const r = g.results;
  const legend = legendFor(g.metric, r);

  return (
    <section aria-label="District map" className="bg-surface rounded-2xl border border-border shadow-card p-6 min-w-0">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div role="radiogroup" aria-label="Colour map by" className="flex rounded-full bg-surface-2 p-1">
          {METRICS.map((m) =>
          <button
            key={m.id}
            role="radio"
            aria-checked={g.metric === m.id}
            onClick={() => g.setMetric(m.id)}
            className={`px-4 py-1.5 rounded-full text-[14px] font-semibold whitespace-nowrap transition-colors ${
            g.metric === m.id ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`
            }>
              {m.label}
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-text-secondary">
          {g.metric === 'cases' ?
          <span className="flex items-center gap-2">
              {legend.low}
              <span className="flex" aria-hidden="true">
                {SCALE.map((c) =>
              <span key={c} className="w-5 h-2.5 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c }} />
              )}
              </span>
              {legend.high}
              <span className="sr-only">{legend.title}</span>
            </span> :

          <>
              {([['within', '<70%'], ['tight', '70–100%'], ['over', '>100%']] as const).map(([k, label]) =>
            <span key={k} className="flex items-center gap-1.5">
                  <span className="w-3.5 h-3.5 rounded" style={{ backgroundColor: BED_COLORS[k] }} /> {label}
                </span>
            )}
            </>
          }
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-border" style={{ backgroundColor: NO_CASES }} /> None
          </span>
          <span className="flex items-center gap-1.5" title="Reached in at least 5% of runs, but not at the median">
            <span className="w-3.5 h-3.5 rounded border border-dashed border-text-secondary bg-surface-2" /> Reached in some runs
          </span>
        </div>
      </div>

      {g.metric === 'beds' && !r?.capacity &&
      <p className="text-[13px] text-text-secondary mb-2">Choose a capacity profile above to compare bed demand with beds.</p>
      }

      {r &&
      <DistrictChoropleth
        boundaries={boundaries}
        districts={r.districts}
        metric={g.metric}
        day={g.day}
        maxCases={r.scale.maxCumulativeCases}
        seedCode={r.seedDistrictCode}
        selectedCode={g.selected?.code ?? null}
        onSelect={g.selectDistrict}
        links={g.showLinks ? r.movement.links ?? [] : null}
        borderRisks={r.borderRisks}
        svgRef={svgRef} />
      }

      <div className="mt-5">
        <SpreadTimeline day={g.day} horizon={g.horizon} onDay={g.setDay} playing={g.playing} onTogglePlay={g.togglePlay} />
      </div>
      <p className="mt-4 text-[11px] text-text-secondary">
        {boundaries.attribution || 'District boundaries: geoBoundaries, CC BY 4.0'}. Colours use one scale for the whole run so days can be compared.
        Border-country risk levels are assumptions, not calculations.
      </p>
    </section>);

}
