import React from 'react';
import { GeoState } from '../../hooks/useGeographicSpread';
import { riskOf } from '../../utils/geographicSpread';

export function TopRiskList({ g }: {g: GeoState;}) {
  return (
    <section>
      <h2 className="text-h3 text-text-primary mb-3">Highest-risk districts</h2>
      <ol className="space-y-1">
        {g.topRisk.map((p) => {
          const risk = riskOf(p, g.scenario.seedDistrictId);
          const selected = p.district.id === g.selected.district.id;
          return (
            <li key={p.district.id}>
              <button
                onClick={() => g.selectDistrict(p.district.id)}
                aria-pressed={selected}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${selected ? 'bg-hover' : 'hover:bg-background'}`}>
                
                <span className="flex-1 min-w-0">
                  <span className="block text-[14px] font-semibold text-text-primary">{p.district.name}</span>
                  <span className="block text-[12px] text-text-secondary">
                    {p.arrival === 0 ? 'Outbreak starts here' : `First case day ${p.arrival}`}
                  </span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold ${
                  risk === 'High' ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-text-secondary'}`
                  }>
                  
                  {risk}
                </span>
              </button>
            </li>);

        })}
      </ol>
    </section>);

}