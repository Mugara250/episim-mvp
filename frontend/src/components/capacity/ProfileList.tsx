import React from 'react';
import { Building2, Plus, Search } from 'lucide-react';
import { institutions } from '../../data/capacityProfiles';
import { CapacityState } from '../../hooks/useCapacityProfiles';
import { fmt } from '../../utils/capacity';

export function ProfileList({ s }: {s: CapacityState;}) {
  return (
    <section className="bg-surface rounded-xl border border-border flex flex-col lg:sticky lg:top-0" aria-label="Capacity profiles">
      <div className="p-5 border-b border-border space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-h3 text-text-primary">Capacity profiles</h2>
          <span className="text-[12px] text-text-secondary">{s.profiles.length}</span>
        </div>
        {s.canCreate &&
        <button
          onClick={s.startNew}
          className="w-full bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors">
          
            <Plus size={15} /> New capacity profile
          </button>
        }
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
          <input
            value={s.query}
            onChange={(e) => s.setQuery(e.target.value)}
            placeholder="Search profiles"
            aria-label="Search profiles"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
          
        </div>
        <select
          value={s.institutionFilter}
          onChange={(e) => s.setInstitutionFilter(e.target.value)}
          aria-label="Filter by institution or region"
          className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
          
          <option value="all">All institutions and regions</option>
          {institutions.map((i) =>
          <option key={i.id} value={i.id}>
              {i.name}
            </option>
          )}
        </select>
      </div>

      <ul className="p-3 space-y-2 overflow-y-auto lg:max-h-[calc(100vh-320px)]">
        {s.isNew &&
        <li className="rounded-lg border border-primary bg-hover px-4 py-3">
            <p className="text-[13px] font-semibold text-text-primary truncate">{s.draft.name.trim() || 'New capacity profile'}</p>
            <p className="text-[12px] text-warning mt-1">Not saved yet</p>
          </li>
        }
        {s.visible.length === 0 && !s.isNew &&
        <li className="px-3 py-8 text-center text-[13px] text-text-secondary">
            {s.profiles.length === 0 ? 'No capacity profiles yet.' : 'No profiles match your search.'}
          </li>
        }
        {s.visible.map((p) => {
          const inst = institutions.find((i) => i.id === p.institutionId);
          const active = p.id === s.selectedId;
          const used = s.usage[p.id] ?? 0;
          return (
            <li key={p.id}>
              <button
                onClick={() => s.select(p.id)}
                aria-current={active}
                className={`w-full text-left rounded-lg border px-4 py-3 transition-colors ${
                active ? 'border-primary bg-hover' : 'border-border hover:border-primary/40'}`
                }>
                
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[13px] font-semibold text-text-primary truncate">{p.name}</span>
                  {active && s.dirty && <span className="w-2 h-2 rounded-full bg-warning mt-1.5 flex-shrink-0" aria-label="Unsaved changes" />}
                </div>
                <p className="text-[12px] text-text-secondary mt-0.5 flex items-center gap-1.5 truncate">
                  <Building2 size={12} className="flex-shrink-0" aria-hidden /> {inst?.name ?? 'Unknown institution'}
                </p>
                <dl className="grid grid-cols-2 gap-2 mt-3">
                  <div>
                    <dt className="text-[11px] text-text-secondary">Hospital beds</dt>
                    <dd className="text-[14px] font-semibold text-text-primary tabular-nums">{fmt(p.hospitalBeds)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">ICU beds</dt>
                    <dd className="text-[14px] font-semibold text-text-primary tabular-nums">{fmt(p.icuBeds)}</dd>
                  </div>
                </dl>
                <div className="flex items-center justify-between gap-2 mt-3">
                  <span className="text-[11px] text-text-secondary truncate">
                    {p.updated} · {p.updatedBy}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${
                    used ? 'bg-primary/15 text-primary' : 'bg-surface-2 text-text-secondary'}`
                    }>
                    
                    Used in {used} comparison{used === 1 ? '' : 's'}
                  </span>
                </div>
              </button>
            </li>);

        })}
      </ul>
    </section>);

}