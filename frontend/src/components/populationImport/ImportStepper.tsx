import React from 'react';
import { Check } from 'lucide-react';

interface ImportStepperProps {
  steps: readonly string[];
  current: number;
  /** Steps the user may jump back to. */
  onSelect?: (index: number) => void;
  locked?: boolean;
}

export function ImportStepper({ steps, current, onSelect, locked }: ImportStepperProps) {
  return (
    <nav aria-label="Import steps" className="bg-surface rounded-xl border border-border px-6 py-5">
      <ol className="flex items-center">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const clickable = done && !locked && !!onSelect;
          return (
            <li key={label} className={`flex items-center ${i < steps.length - 1 ? 'flex-1' : ''}`}>
              <button
                type="button"
                onClick={() => clickable && onSelect?.(i)}
                disabled={!clickable}
                aria-current={active ? 'step' : undefined}
                className={`flex items-center gap-3 rounded-lg -m-1 p-1 ${clickable ? 'cursor-pointer hover:bg-hover' : 'cursor-default'}`}>
                
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold flex-shrink-0 transition-colors ${
                  done ?
                  'bg-primary text-white' :
                  active ?
                  'bg-hover text-primary ring-2 ring-primary' :
                  'bg-surface-2 text-text-secondary'}`
                  }>
                  
                  {done ? <Check size={15} strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`hidden sm:block text-[13px] whitespace-nowrap ${active ? 'font-semibold text-text-primary' : done ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
                  
                  {label}
                </span>
              </button>
              {i < steps.length - 1 &&
              <span aria-hidden className={`flex-1 h-px mx-4 ${done ? 'bg-primary' : 'bg-border'}`} />
              }
            </li>);

        })}
      </ol>
    </nav>);

}