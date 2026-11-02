import { Copy, Eye, FolderOpen, Globe2, Lock, PlayCircle, Plus, Search, Share2, Trash2 } from 'lucide-react';
import { ScenariosState } from '../../hooks/useScenarios';
import { Scenario } from '../../types/scenarios';
import { dateLabel, datasetLabel, packageLabel, PERMISSION_LABELS } from '../../utils/scenarios';

const selectCls = 'px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary';

function IconAction({ label, onClick, icon: Icon, danger }: {label: string;onClick: () => void;icon: typeof Eye;danger?: boolean;}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
      danger ? 'text-text-secondary hover:text-danger hover:bg-danger/10' : 'text-text-secondary hover:text-primary hover:bg-hover'}`
      }>
      
      <Icon size={16} />
    </button>);

}

function StatusBadge({ s }: {s: Scenario;}) {
  if (s.draft) return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Draft</span>;
  return s.shares.length ?
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">
      <Globe2 size={10} /> Shared
    </span> :

  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">
      <Lock size={10} /> Private
    </span>;

}

export function ScenarioLibrary({ s }: {s: ScenariosState;}) {
  const shared = s.tab === 'shared';
  const tabs = [
  { id: 'mine' as const, label: 'My scenarios', count: s.mine.length },
  { id: 'shared' as const, label: 'Shared with me', count: s.shared.length }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[13px] text-text-secondary mb-2">Scenarios</p>
          <h1 className="text-h1 text-text-primary mb-1">Scenarios</h1>
          <p className="text-body text-text-secondary max-w-2xl">
            A scenario combines a population, a disease and an optional intervention package into one setup you can run.
          </p>
        </div>
        {s.canCreate &&
        <button onClick={() => s.setMode({ kind: 'new' })} className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors">
            <Plus size={16} /> New scenario
          </button>
        }
      </div>

      <section className="bg-surface rounded-xl border border-border">
        <div className="px-6 pt-4 border-b border-border flex flex-wrap items-end justify-between gap-4">
          <div role="tablist" className="flex gap-6">
            {tabs.map((t) =>
            <button
              key={t.id}
              role="tab"
              aria-selected={s.tab === t.id}
              onClick={() => s.setTab(t.id)}
              className={`pb-3 -mb-px border-b-2 text-[13px] font-semibold flex items-center gap-2 transition-colors ${
              s.tab === t.id ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`
              }>
              
                {t.label}
                <span className="px-1.5 py-0.5 rounded-full bg-surface-2 text-[11px] text-text-secondary">{t.count}</span>
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pb-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
              <input
                value={s.query}
                onChange={(e) => s.setQuery(e.target.value)}
                placeholder="Search by name or owner"
                aria-label="Search scenarios"
                className="w-60 pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
              
            </div>
            <select value={s.diseaseFilter} onChange={(e) => s.setDiseaseFilter(e.target.value)} aria-label="Filter by disease" className={selectCls}>
              <option value="all">All diseases</option>
              {s.diseaseOptions.map((p) =>
              <option key={p.id} value={p.id}>{p.name}</option>
              )}
            </select>
            <select value={s.datasetFilter} onChange={(e) => s.setDatasetFilter(e.target.value)} aria-label="Filter by population dataset" className={selectCls}>
              <option value="all">All population datasets</option>
              {s.datasetOptions.map((d) =>
              <option key={d.id} value={d.id}>{d.name}</option>
              )}
            </select>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_200px] gap-4 px-6 py-3 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide">
          <span>Name</span>
          <span>Disease</span>
          <span>Population dataset</span>
          <span>Interventions</span>
          <span>{shared ? 'Shared by' : 'Owner'}</span>
          <span className="text-right">Actions</span>
        </div>

        {s.loading ?
        <ul aria-busy="true" aria-label="Loading scenarios">
            {[0, 1, 2, 3].map((i) =>
          <li key={i} className="px-6 py-5 border-b border-border last:border-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_200px] gap-4 animate-pulse">
                <div className="space-y-2">
                  <div className="h-3.5 w-3/4 rounded bg-surface-2" />
                  <div className="h-3 w-1/3 rounded bg-surface-2" />
                </div>
                {[0, 1, 2, 3].map((j) =>
            <div key={j} className="hidden lg:block h-3.5 w-2/3 rounded bg-surface-2 self-center" />
            )}
                <div className="hidden lg:block h-7 w-32 rounded bg-surface-2 justify-self-end" />
              </li>
          )}
          </ul> :
        s.rows.length === 0 ?
        <div className="px-6 py-16 text-center">
            <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-3">
              <FolderOpen size={20} className="text-primary" />
            </span>
            {s.filtersActive ?
          <>
                <h2 className="text-h3 text-text-primary">No scenarios match these filters</h2>
                <button onClick={s.clearFilters} className="mt-3 text-[13px] font-semibold text-primary hover:underline">Clear filters</button>
              </> :
          shared ?
          <>
                <h2 className="text-h3 text-text-primary">Nothing shared with you yet</h2>
                <p className="text-[13px] text-text-secondary mt-1 max-w-md mx-auto">
                  When a colleague shares a scenario with you or {s.institution}, it appears here.
                </p>
              </> :

          <>
                <h2 className="text-h3 text-text-primary">No scenarios yet</h2>
                <p className="text-[13px] text-text-secondary mt-1 max-w-md mx-auto">
                  {s.canCreate ?
              'Combine a population, a disease and an optional intervention package to create your first scenario.' :
              'Clone a scenario shared with you to keep your own copy here.'}
                </p>
                {s.canCreate ?
            <button onClick={() => s.setMode({ kind: 'new' })} className="mt-5 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 transition-colors">
                    <Plus size={15} /> New scenario
                  </button> :

            <button onClick={() => s.setTab('shared')} className="mt-3 text-[13px] font-semibold text-primary hover:underline">See shared scenarios</button>
            }
              </>
          }
          </div> :

        <ul>
            {s.rows.map((sc) => {
            const access = s.access(sc);
            const manage = s.canManage(sc);
            return (
              <li
                key={sc.id}
                className="px-6 py-4 border-b border-border last:border-0 grid grid-cols-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1.2fr)_minmax(0,1fr)_200px] gap-x-4 gap-y-2 items-center">
                
                  <div className="min-w-0">
                    <button
                    onClick={() => s.setMode(sc.draft ? { kind: 'draft', id: sc.id } : { kind: 'view', id: sc.id })}
                    className="text-[14px] font-semibold text-text-primary hover:text-primary text-left truncate max-w-full block">
                    
                      {sc.name}
                    </button>
                    <span className="flex items-center gap-2 mt-1 text-[12px] text-text-secondary">
                      {sc.id} · {dateLabel(sc.created)}
                      {!shared && <StatusBadge s={sc} />}
                    </span>
                  </div>
                  <span className="text-[13px] text-text-primary truncate">
                    {sc.presetName ?? <span className="text-text-secondary">Not chosen</span>}
                    {sc.presetProvisional && <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-warning/15 text-warning">Provisional</span>}
                  </span>
                  <span className="text-[13px] text-text-primary truncate">{sc.datasetId ? datasetLabel(sc) : <span className="text-text-secondary">Not chosen</span>}</span>
                  <span className={`text-[13px] truncate ${sc.packageId ? 'text-text-primary' : 'text-text-secondary'}`}>{packageLabel(sc.packageName)}</span>
                  <div className="min-w-0">
                    <span className="block text-[13px] text-text-primary truncate">{shared ? sc.owner : sc.ownerId === s.userId ? 'You' : sc.owner}</span>
                    {shared && access && access !== 'admin' && access !== 'owner' &&
                  <span className="block text-[12px] text-text-secondary">{PERMISSION_LABELS[access]}</span>
                  }
                  </div>
                  <div className="flex items-center lg:justify-end gap-0.5">
                    {sc.draft ?
                  <button onClick={() => s.setMode({ kind: 'draft', id: sc.id })} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold text-primary hover:bg-hover mr-1">
                        Continue
                      </button> :

                  <IconAction label="Open" icon={Eye} onClick={() => s.setMode({ kind: 'view', id: sc.id })} />
                  }
                    {s.canClone(sc) && <IconAction label="Clone" icon={Copy} onClick={() => s.setMode({ kind: 'clone', fromId: sc.id })} />}
                    {!shared && manage && !sc.draft && <IconAction label="Share" icon={Share2} onClick={() => s.openShare(sc.id)} />}
                    {s.canRun && !sc.draft && <IconAction label="Run simulation" icon={PlayCircle} onClick={() => s.run(sc)} />}
                    {!shared && manage && <IconAction label="Delete" icon={Trash2} danger onClick={() => s.askDelete(sc.id)} />}
                  </div>
                </li>);

          })}
          </ul>
        }
      </section>
      <p className="text-[12px] text-text-secondary">Seeded sample scenarios and population figures are illustrative, not verified data. Simulation results are scenario estimates, not forecasts.</p>
    </div>);

}