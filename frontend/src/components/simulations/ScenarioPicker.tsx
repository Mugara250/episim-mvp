import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { Scenario } from '../../types/scenarios';
import { datasetLabel, packageLabel } from '../../utils/scenarios';

interface ScenarioPickerProps {
  scenarios: Scenario[];
  value: string | null;
  onChange: (id: string) => void;
  userId: string;
  disabled?: boolean;
}

function Meta({ s }: {s: Scenario;}) {
  return (
    <span className="block text-[12px] text-text-secondary truncate">
      {s.presetName ?? 'No disease'}{s.presetProvisional ? ' (provisional)' : ''} · {datasetLabel(s)} · {packageLabel(s.packageName)}
    </span>);

}

/** Searchable list of the scenarios this user can run. */
export function ScenarioPicker({ scenarios, value, onChange, userId, disabled }: ScenarioPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrap = useRef<HTMLDivElement>(null);
  const selected = scenarios.find((s) => s.id === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s: Scenario) =>
    !q || s.name.toLowerCase().includes(q) || (s.presetName ?? '').toLowerCase().includes(q);
    return [
    { label: 'My scenarios', items: scenarios.filter((s) => s.ownerId === userId && match(s)) },
    { label: 'Shared with me', items: scenarios.filter((s) => s.ownerId !== userId && match(s)) }].
    filter((g) => g.items.length);
  }, [scenarios, query, userId]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={wrap} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border bg-background text-left hover:border-primary/40 focus:outline-none focus:border-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
        
        <span className="flex-1 min-w-0">
          {selected ?
          <>
              <span className="block text-[14px] font-semibold text-text-primary truncate">{selected.name}</span>
              <Meta s={selected} />
            </> :

          <span className="block text-[14px] text-text-secondary">Choose a scenario to run</span>
          }
        </span>
        <ChevronDown size={16} className={`text-text-secondary flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open &&
      <div className="absolute z-30 left-0 right-0 mt-2 rounded-xl border border-border bg-surface shadow-card overflow-hidden">
          <div className="p-2 border-b border-border">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
              <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by scenario or disease"
              aria-label="Search scenarios"
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
            
            </div>
          </div>
          <div role="listbox" className="max-h-80 overflow-y-auto py-1">
            {groups.length === 0 ?
          <p className="px-4 py-6 text-center text-[13px] text-text-secondary">No scenarios match “{query}”.</p> :

          groups.map((g) =>
          <div key={g.label}>
                  <p className="px-4 pt-3 pb-1 text-[11px] font-semibold text-text-secondary uppercase tracking-wide">{g.label}</p>
                  {g.items.map((s) =>
            <button
              key={s.id}
              role="option"
              aria-selected={s.id === value}
              onClick={() => pick(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${s.id === value ? 'bg-hover' : 'hover:bg-hover'}`}>
              
                      <span className="flex-1 min-w-0">
                        <span className="block text-[13px] font-medium text-text-primary truncate">{s.name}</span>
                        <Meta s={s} />
                      </span>
                      {s.id === value && <Check size={15} className="text-primary flex-shrink-0" />}
                    </button>
            )}
                </div>
          )
          }
          </div>
        </div>
      }
    </div>);

}