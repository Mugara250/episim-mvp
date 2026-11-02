import React from 'react';
import { ArrowRight } from 'lucide-react';

const STATES = [
{ id: 'S', label: 'Susceptible' },
{ id: 'E', label: 'Exposed' },
{ id: 'I', label: 'Infectious (community)' },
{ id: 'H', label: 'Hospital' },
{ id: 'F', label: 'Funeral' },
{ id: 'R', label: 'Removed' }];


export function SeihfrDiagram() {
  return (
    <div>
      <ol className="flex flex-wrap items-center gap-2" aria-label="SEIHFR compartments">
        {STATES.map((s, i) =>
        <li key={s.id} className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-background border border-border rounded-lg px-3 py-2">
              <span className="w-7 h-7 rounded-md bg-hover text-primary text-[13px] font-bold flex items-center justify-center">{s.id}</span>
              <span className="text-[12px] text-text-secondary whitespace-nowrap">{s.label}</span>
            </div>
            {i < STATES.length - 1 && <ArrowRight size={14} className="text-text-secondary flex-shrink-0" />}
          </li>
        )}
      </ol>
      <p className="text-[12px] text-text-secondary leading-relaxed mt-4">
        People can be infected by sick people in the <span className="text-text-primary">community (I)</span>, in{' '}
        <span className="text-text-primary">hospital (H)</span> and at <span className="text-text-primary">unsafe funerals (F)</span>.
        Every daily step is a random draw. While there are fewer than 20 cases, new infections come from the
        branching process, so some runs die out by chance. Hospital staff are tracked by the health-worker layer.
      </p>
    </div>);

}