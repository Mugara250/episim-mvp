import React from 'react';
import { GeoState } from '../../hooks/useGeographicSpread';
import { GeoMetric } from '../../types/geographic';
import { legendFor, NO_CASES, SCALE, strongestLinks } from '../../utils/geographicSpread';
import { DistrictTileMap } from './DistrictTileMap';
import { SpreadTimeline } from './SpreadTimeline';

const METRICS: {id: GeoMetric;label: string;}[] = [
{ id: 'cases', label: 'Cases' },
{ id: 'beds', label: 'Beds vs capacity' }];


export function GeoMapCard({ g, svgRef }: {g: GeoState;svgRef: React.RefObject<SVGSVGElement>;}) {
  const legend = legendFor(g.metric, g.maxCases);

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
          <span className="flex items-center gap-2">
            {legend.low}
            <span className="flex" aria-hidden="true">
              {SCALE.map((c) =>
              <span key={c} className="w-5 h-2.5 first:rounded-l-full last:rounded-r-full" style={{ backgroundColor: c }} />
              )}
            </span>
            {legend.high}
            <span className="sr-only">{legend.title}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border border-border" style={{ backgroundColor: NO_CASES }} /> No cases
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded border-2 border-danger" /> Over capacity
          </span>
        </div>
      </div>

      <DistrictTileMap
        projections={g.projections}
        metric={g.metric}
        day={g.day}
        maxCases={g.maxCases}
        selectedId={g.selected.district.id}
        onSelect={g.selectDistrict}
        links={g.showLinks ? strongestLinks : null}
        svgRef={svgRef} />
      

      <div className="mt-5">
        <SpreadTimeline day={g.day} horizon={g.scenario.horizon} onDay={g.setDay} playing={g.playing} onTogglePlay={g.togglePlay} />
      </div>
    </section>);

}