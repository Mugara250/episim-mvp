import React from 'react';
import { ChevronDown } from 'lucide-react';
import { geoCapacityProfiles, geoScenarios } from '../../data/geographic';

interface GeoHeaderProps {
  scenarioId: string;
  onScenario: (id: string) => void;
  capacityId: string;
  onCapacity: (id: string) => void;
  illustrative: boolean;
}

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

export function GeoHeader({ scenarioId, onScenario, capacityId, onCapacity, illustrative }: GeoHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <h1 className="text-h1 text-text-primary">Geographic Spread</h1>
        {illustrative &&
        <span className="px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[12px] font-semibold text-text-secondary">Illustrative data</span>
        }
      </div>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <div className="w-full sm:w-[300px]">
          <Select label="Scenario" value={scenarioId} onChange={onScenario}>
            {geoScenarios.map((s) =>
            <option key={s.id} value={s.id}>{s.name}</option>
            )}
          </Select>
        </div>
        <div className="w-full sm:w-[250px]">
          <Select label="Capacity profile" value={capacityId} onChange={onCapacity}>
            {geoCapacityProfiles.map((c) =>
            <option key={c.id} value={c.id}>{c.name}</option>
            )}
          </Select>
        </div>
      </div>
    </header>);

}