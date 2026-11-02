import React, { useState } from 'react';
import { ArrowDown, ArrowRight } from 'lucide-react';

interface Compartment {
  id: string;
  label: string;
  short: string;
  help: string;
  spreads?: boolean;
}

const C: Record<string, Compartment> = {
  S: { id: 'S', label: 'Susceptible', short: 'S', help: 'People who could still catch the disease.' },
  E: { id: 'E', label: 'Exposed', short: 'E', help: 'Infected but not yet sick or able to pass it on (the incubation period).' },
  I: { id: 'I', label: 'Infectious (community)', short: 'I', help: 'Sick people at home or in the community who can infect others.', spreads: true },
  H: { id: 'H', label: 'Hospitalized', short: 'H', help: 'Patients in hospital. They can still infect health workers and other patients.', spreads: true },
  F: { id: 'F', label: 'Funeral', short: 'F', help: 'People who died and have not yet been buried. Touching the body during unsafe burials can spread infection.', spreads: true },
  R: { id: 'R', label: 'Removed', short: 'R', help: 'People who recovered, or who died and were buried. They no longer spread the disease.' }
};

function Node({ c, active, onFocus }: {c: Compartment;active: boolean;onFocus: (id: string | null) => void;}) {
  return (
    <button
      type="button"
      onMouseEnter={() => onFocus(c.id)}
      onMouseLeave={() => onFocus(null)}
      onFocus={() => onFocus(c.id)}
      onBlur={() => onFocus(null)}
      aria-describedby="model-help"
      className={`w-full rounded-lg border px-3 py-2 text-left transition-colors duration-150 ${
      active ? 'border-primary bg-primary/5' : c.spreads ? 'border-danger/30 bg-danger/5' : 'border-border bg-background'}`
      }>
      
      <span className="flex items-center gap-2">
        <span className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center ${c.spreads ? 'bg-danger/15 text-danger' : 'bg-surface-2 text-text-secondary'}`}>
          {c.short}
        </span>
        <span className="text-[12px] font-semibold text-text-primary">{c.label}</span>
      </span>
    </button>);

}

const Down = () =>
<div className="flex justify-center py-1" aria-hidden>
    <ArrowDown size={14} className="text-text-secondary" />
  </div>;


/** Explains the SEIHFR model in plain words. */
export function ModelInfoCard() {
  const [focus, setFocus] = useState<string | null>(null);
  const help = focus ? C[focus] : null;
  return (
    <aside aria-labelledby="model-title" className="bg-surface rounded-xl border border-border p-6 space-y-5 lg:sticky lg:top-6">
      <div>
        <p className="text-[12px] font-medium text-text-secondary mb-1">About this model</p>
        <h2 id="model-title" className="text-h3 text-text-primary">SEIHFR model (Ebola and Marburg)</h2>
      </div>

      <figure>
        <div role="group" aria-label="How people move through the model">
          <Node c={C.S} active={focus === 'S'} onFocus={setFocus} />
          <Down />
          <Node c={C.E} active={focus === 'E'} onFocus={setFocus} />
          <Down />
          <Node c={C.I} active={focus === 'I'} onFocus={setFocus} />
          <div className="grid grid-cols-2 gap-2 py-1" aria-hidden>
            <div className="flex justify-center"><ArrowDown size={14} className="text-text-secondary" /></div>
            <div className="flex justify-center"><ArrowDown size={14} className="text-text-secondary" /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Node c={C.H} active={focus === 'H'} onFocus={setFocus} />
            <Node c={C.F} active={focus === 'F'} onFocus={setFocus} />
          </div>
          <Down />
          <Node c={C.R} active={focus === 'R'} onFocus={setFocus} />
        </div>
        <figcaption id="model-help" aria-live="polite" className="mt-3 min-h-[40px] text-[12px] text-text-secondary">
          {help ?
          <>
              <span className="font-semibold text-text-primary">{help.label}: </span>
              {help.help}
            </> :

          <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-danger/15 border border-danger/30" aria-hidden />
              Red boxes can still spread infection. Hover a box for a definition.
            </span>
          }
        </figcaption>
      </figure>

      <div className="space-y-3 pt-4 border-t border-border text-[13px] text-text-secondary">
        <p>
          Interventions act on specific routes: safe burials reduce funeral spread, hospital infection control reduces hospital spread, and contact tracing reduces community spread.
        </p>
        <p className="flex items-start gap-2">
          <ArrowRight size={14} className="mt-0.5 flex-shrink-0 text-primary" />
          Results show the expected course of the outbreak, not the chance of it dying out on its own.
        </p>
      </div>
    </aside>);

}