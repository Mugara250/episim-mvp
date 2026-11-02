import React from 'react';
import { BookOpen, ChevronRight, Copy, Lock, Plus, Search } from 'lucide-react';
import { InterventionTypesState } from '../../hooks/useInterventionTypes';
import { TypeFilter } from '../../types/interventions';
import { pct } from '../../utils/interventions';
import { MechanismBadge } from './MechanismBadge';

const FILTERS: {id: TypeFilter;label: string;}[] = [
{ id: 'all', label: 'All' },
{ id: 'builtin', label: 'Built-in' },
{ id: 'custom', label: 'Custom' }];


export function TypeLibrary({ s }: {s: InterventionTypesState;}) {
  const showEmptyCustom = s.filter === 'custom' && s.customCount === 0;
  const suggestions = s.types.filter((t) => t.builtIn).slice(0, 2);

  return (
    <section className="bg-surface rounded-xl border border-border overflow-hidden">
      <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <label htmlFor="type-search" className="sr-only">Search intervention types</label>
          <input
            id="type-search"
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="Search by name or mechanism"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-primary" />
          
        </div>
        <div className="flex gap-2" role="group" aria-label="Filter types">
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
        {s.canEdit &&
        <button
          onClick={s.startNew}
          className="md:ml-auto bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-1.5 whitespace-nowrap transition-colors">
          
            <Plus size={15} /> New type
          </button>
        }
      </div>

      {showEmptyCustom ?
      <div className="px-6 py-14 text-center max-w-md mx-auto">
          <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-4">
            <Copy size={20} className="text-primary" />
          </span>
          <p className="text-[15px] font-semibold text-text-primary">No custom types yet</p>
          <p className="text-[13px] text-text-secondary mt-1 mb-5">
            {s.canEdit ?
          'Clone a built-in type and adjust its effect size, or create one from scratch.' :
          'Custom types made by Epidemiologists will appear here.'}
          </p>
          {s.canEdit &&
        <div className="flex flex-wrap justify-center gap-2">
              {suggestions.map((t) =>
          <button
            key={t.id}
            onClick={() => s.clone(t)}
            className="px-3 py-2 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
            
                  Clone {t.name}
                </button>
          )}
              <button onClick={s.startNew} className="px-3 py-2 rounded-lg text-[13px] font-semibold text-primary hover:underline">
                Start from scratch
              </button>
            </div>
        }
        </div> :
      s.visible.length === 0 ?
      <div className="px-6 py-14 text-center">
          <p className="text-[14px] font-semibold text-text-primary">No types match “{s.query}”</p>
          <button onClick={() => s.setQuery('')} className="text-[13px] font-semibold text-primary hover:underline mt-2">
            Clear search
          </button>
        </div> :

      <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-background text-left text-text-secondary">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Effect mechanism</th>
                <th className="px-6 py-3 font-medium text-right">Default effect size</th>
                <th className="px-6 py-3 font-medium">Citation</th>
                <th className="px-6 py-3" aria-hidden />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.visible.map((t) => {
              const active = s.openId === t.id;
              return (
                <tr
                  key={t.id}
                  onClick={() => s.openType(t.id)}
                  className={`cursor-pointer transition-colors ${active ? 'bg-hover' : 'hover:bg-background'}`}>
                  
                    <td className="px-6 py-4">
                      <button
                      onClick={(e) => {
                        e.stopPropagation();
                        s.openType(t.id);
                      }}
                      className="flex items-center gap-2 text-left">
                      
                        {t.builtIn && <Lock size={13} className="text-text-secondary flex-shrink-0" aria-label="Built-in" />}
                        <span>
                          <span className="block font-semibold text-text-primary">{t.name}</span>
                          <span className="block text-[12px] text-text-secondary font-mono">{t.key}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <MechanismBadge mechanism={t.mechanism} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-semibold text-text-primary tabular-nums">{pct(t.defaultEffect)}</span>
                      {t.placeholder && <span className="block text-[11px] text-warning">Placeholder</span>}
                    </td>
                    <td className="px-6 py-4">
                      {t.source.trim() ?
                    <span className="inline-flex items-center gap-1.5 text-text-secondary">
                          <BookOpen size={14} className="text-primary" /> Cited
                        </span> :

                    <span className="inline-flex items-center gap-1.5 text-warning">
                          <BookOpen size={14} /> Missing
                        </span>
                    }
                    </td>
                    <td className="px-6 py-4 text-right">
                      <ChevronRight size={16} className="text-text-secondary inline" />
                    </td>
                  </tr>);

            })}
            </tbody>
          </table>
        </div>
      }
    </section>);

}