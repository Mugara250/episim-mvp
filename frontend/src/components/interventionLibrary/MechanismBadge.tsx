import React, { useState } from 'react';
import { ArrowRightLeft, Gauge } from 'lucide-react';
import { MECHANISM_HELP, MECHANISM_LABELS } from '../../data/interventions';
import { EffectMechanism } from '../../types/interventions';

export function MechanismBadge({ mechanism, tooltip = true }: {mechanism: EffectMechanism;tooltip?: boolean;}) {
  const [open, setOpen] = useState(false);
  const Icon = mechanism === 'rate' ? Gauge : ArrowRightLeft;
  const tone = mechanism === 'rate' ? 'bg-hover text-primary' : 'bg-accent/15 text-accent';
  const badge =
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${tone}`}>
      <Icon size={12} aria-hidden /> {MECHANISM_LABELS[mechanism]}
    </span>;

  if (!tooltip) return badge;
  return (
    <span
      className="relative inline-flex"
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => e.stopPropagation()}>
      
      {badge}
      {open &&
      <span
        role="tooltip"
        className="absolute z-30 left-0 top-full mt-2 w-64 px-3 py-2 rounded-lg bg-surface-2 border border-border text-[12px] font-normal text-text-primary shadow-card">
        
          {MECHANISM_HELP[mechanism]}
        </span>
      }
    </span>);

}