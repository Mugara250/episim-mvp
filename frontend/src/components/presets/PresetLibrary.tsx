import { Copy, Lock, Plus, Search } from 'lucide-react';
import { DiseasePresetsState } from '../../hooks/useDiseasePresets';
import { PresetFilter } from '../../types/presets';
import { asPercent } from '../../utils/presets';

const FILTERS: {id: PresetFilter;label: string;}[] = [
{ id: 'all', label: 'All' },
{ id: 'builtin', label: 'Built-in' },
{ id: 'custom', label: 'Custom' }];


export function PresetLibrary({ s }: {s: DiseasePresetsState;}) {
  const builtInSuggestions = s.presets.filter((p) => p.builtIn).slice(0, 2);
  const showEmptyCustom = s.filter === 'custom' && s.customCount === 0 && !s.isNew;

  return (
    <aside className="bg-surface rounded-xl border border-border flex flex-col lg:sticky lg:top-6 lg:max-h-[calc(100vh-140px)]" aria-label="Preset library">
      <div className="p-5 border-b border-border space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-h3 text-text-primary">Library</h2>
          {s.canCreate &&
          <button
            onClick={s.startNew}
            className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors">
            
              <Plus size={15} /> New preset
            </button>
          }
        </div>
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <label htmlFor="preset-search" className="sr-only">Search presets</label>
          <input
            id="preset-search"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="Search by name or virus"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary" />
          
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter presets">
          {FILTERS.map((f) =>
          <button
            key={f.id}
            onClick={() => s.setFilter(f.id)}
            aria-pressed={s.filter === f.id}
            className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-colors ${
            s.filter === f.id ? 'bg-hover border-primary/40 text-primary' : 'border-border text-text-secondary hover:text-text-primary'}`
            }>
            
              {f.label}
              {f.id === 'custom' && <span className="ml-1 opacity-70">{s.customCount}</span>}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {s.isNew &&
        <div className="w-full text-left p-4 rounded-lg border border-primary/50 bg-hover">
            <p className="text-[14px] font-semibold text-text-primary truncate">{s.draft.name || 'New preset'}</p>
            <p className="text-[12px] text-text-secondary mt-1">Not saved yet</p>
          </div>
        }

        {showEmptyCustom ?
        <div className="px-4 py-10 text-center">
            <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-4">
              <Copy size={20} className="text-primary" />
            </span>
            <p className="text-[14px] font-semibold text-text-primary">No custom presets yet</p>
            <p className="text-[13px] text-text-secondary mt-1 mb-5">
              {s.canCreate ?
            'Start from a built-in preset and adjust it for your setting.' :
            'Custom presets made by Epidemiologists will appear here.'}
            </p>
            {s.canCreate &&
          <div className="flex flex-col gap-2">
                {builtInSuggestions.map((p) =>
            <button
              key={p.id}
              onClick={() => s.clone(p)}
              className="px-3 py-2 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
              
                    Clone {p.name}
                  </button>
            )}
              </div>
          }
          </div> :
        s.loading ?
        <p className="px-4 py-10 text-center text-[13px] text-text-secondary">Loading presets…</p> :
        s.visible.length === 0 && !s.isNew ?
        <div className="px-4 py-10 text-center">
            <p className="text-[14px] font-semibold text-text-primary">No presets match “{s.query}”</p>
            <button onClick={() => s.setQuery('')} className="text-[13px] font-semibold text-primary hover:underline mt-2">
              Clear search
            </button>
          </div> :

        <ul className="space-y-2">
            {s.visible.map((p) => {
            const active = p.id === s.selectedId;
            const changed = active && s.dirty;
            return (
              <li key={p.id}>
                  <button
                  onClick={() => s.select(p.id)}
                  aria-current={active ? 'true' : undefined}
                  className={`w-full text-left p-4 rounded-lg border transition-colors ${
                  active ? 'border-primary/50 bg-hover' : 'border-border hover:border-primary/30'}`
                  }>
                  
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex items-center gap-1.5 min-w-0">
                        {p.builtIn && <Lock size={13} className="text-text-secondary flex-shrink-0" aria-label="Built-in" />}
                        <span className="text-[14px] font-semibold text-text-primary truncate">{p.name}</span>
                      </span>
                      {changed && <span className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" aria-label="Unsaved changes" />}
                    </div>
                    <span className="flex flex-wrap gap-1.5 mt-2">
                      <span className="px-2 py-0.5 rounded-full bg-surface-2 text-[11px] font-semibold text-text-secondary">{p.virus || p.disease}</span>
                      {p.provisional &&
                    <span className="px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[11px] font-semibold">Provisional</span>
                    }
                    </span>
                    <dl className="mt-3 grid grid-cols-3 gap-2 text-[12px]">
                      <div>
                        <dt className="text-text-secondary">R0</dt>
                        <dd className="text-text-primary font-semibold tabular-nums">
                          {p.r0Likely}
                          <span className="text-text-secondary font-normal"> ({p.r0Low}–{p.r0High})</span>
                        </dd>
                      </div>
                      <div>
                        <dt className="text-text-secondary">Fatality, admitted</dt>
                        <dd className="text-text-primary font-semibold tabular-nums">{asPercent(p.cfrHospital)}</dd>
                      </div>
                      <div>
                        <dt className="text-text-secondary">Incubation</dt>
                        <dd className="text-text-primary font-semibold tabular-nums">{p.incubationDays} d</dd>
                      </div>
                    </dl>
                  </button>
                </li>);

          })}
          </ul>
        }
      </div>
    </aside>);

}