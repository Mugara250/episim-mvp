import React from 'react';
import { Check } from 'lucide-react';

interface ChoiceCardProps {
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

/** A selectable card used as a radio option in the scenario builder. */
export function ChoiceCard({ selected, onSelect, disabled, children }: ChoiceCardProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onSelect}
      className={`relative w-full h-full text-left rounded-xl border p-5 flex flex-col transition-colors duration-150 ease-out disabled:cursor-default ${
      selected ? 'border-primary bg-hover ring-1 ring-primary' : 'border-border bg-surface hover:border-primary/40'}`
      }>
      
      <span
        aria-hidden
        className={`absolute top-4 right-4 w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
        selected ? 'bg-primary border-primary text-white' : 'border-border'}`
        }>
        
        {selected && <Check size={12} strokeWidth={3} />}
      </span>
      {children}
    </button>);

}