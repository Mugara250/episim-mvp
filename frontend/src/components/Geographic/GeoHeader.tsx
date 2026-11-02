import React from 'react';
import { ChevronDown } from 'lucide-react';
import { GeoState } from '../../hooks/useGeographicSpread';

function Select({ label, value, onChange, children }: {label: string;value: string;onChange: (v: string) => void;children: React.ReactNode;}) {
  return (
    <div className="relative min-w-0">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-10 w-full pl-4 pr-9 rounded-full border border-border bg-surface text-[14px] font-medium text-text-primary focus:outline-none focus:border-primary cursor-pointer">
        {children}
      </select>
      <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
    </div>);

}

export function GeoHeader({ g }: {g: GeoState;}) {
  const r = g.results;
  const illustrative = !!r && (r.illustrative || !!r.capacity?.placeholder);
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-h1 text-text-primary">Geographic Spread</h1>
          {illustrative &&
          <span className="px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[12px] font-semibold text-text-secondary">Illustrative data</span>
          }
        </div>
        <p className="text-[13px] text-text-secondary mt-1">Scenario estimates, not forecasts. District model with estimated movement between districts.</p>
      </div>
      {g.geoRuns.length > 0 &&
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-[320px]">
            <Select label="Geographic run" value={g.runId ?? ''} onChange={g.setRunId}>
              {g.geoRuns.map((run) =>
            <option key={run.id} value={run.id}>
                  {run.scenarioName} · {run.id}
                </option>
            )}
            </Select>
          </div>
          <div className="w-full sm:w-[280px]">
            <Select label="Capacity profile" value={g.capacityId ?? ''} onChange={(v) => g.setCapacityId(v || null)}>
              <option value="">No capacity profile</option>
              {g.capacityOptions.map((c) =>
            <option key={c.id} value={c.id}>
                  {c.name}
                  {c.hasDistrictBeds ? '' : ' (beds split by population)'}
                </option>
            )}
            </Select>
          </div>
        </div>
      }
    </header>);

}
