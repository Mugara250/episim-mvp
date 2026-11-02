import React from 'react';
import { Plus } from 'lucide-react';
import { InterventionPackagesState } from '../../hooks/useInterventionPackages';

export function PackageList({ s }: {s: InterventionPackagesState;}) {
  return (
    <aside className="bg-surface rounded-xl border border-border lg:sticky lg:top-6" aria-label="Packages">
      <div className="p-5 border-b border-border flex items-center justify-between gap-3">
        <h2 className="text-h3 text-text-primary">Packages</h2>
        {s.canEdit &&
        <button
          onClick={s.startNew}
          className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors">
          
            <Plus size={15} /> New package
          </button>
        }
      </div>
      <ul className="p-3 space-y-2">
        {s.isNew &&
        <li className="p-4 rounded-lg border border-primary/50 bg-hover">
            <p className="text-[14px] font-semibold text-text-primary truncate">{s.draft.name || 'New package'}</p>
            <p className="text-[12px] text-text-secondary mt-1">Not saved yet · {s.draft.items.length} interventions</p>
          </li>
        }
        {s.packages.map((p) => {
          const active = p.id === s.selectedId;
          const count = active ? s.draft.items.length : p.items.length;
          return (
            <li key={p.id}>
              <button
                onClick={() => s.select(p.id)}
                aria-current={active ? 'true' : undefined}
                className={`w-full text-left p-4 rounded-lg border transition-colors ${active ? 'border-primary/50 bg-hover' : 'border-border hover:border-primary/30'}`}>
                
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[14px] font-semibold text-text-primary">{p.name}</span>
                  {active && s.dirty && <span className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" aria-label="Unsaved changes" />}
                </div>
                <p className="text-[12px] text-text-secondary mt-1 line-clamp-2">{p.description || 'No description'}</p>
                <p className="text-[12px] font-medium text-text-primary mt-2">
                  {count} {count === 1 ? 'intervention' : 'interventions'}
                </p>
              </button>
            </li>);

        })}
      </ul>
    </aside>);

}