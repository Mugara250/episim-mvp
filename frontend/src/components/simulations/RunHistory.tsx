import { BarChart3, FileText, GitCompare, History, Map as MapIcon, RotateCcw, Search, X } from 'lucide-react';
import { RunHistoryState, StatusFilter } from '../../hooks/useRunHistory';
import { SimulationRun } from '../../types/simulationRuns';
import { formatDuration, formatPct, formatRange, formatStarted, isActive, MODEL_LABELS, STATUS_LABELS } from '../../utils/simulationRuns';
import { RunStatusBadge } from './RunStatusBadge';

interface RunHistoryProps {
  h: RunHistoryState;
  totalRuns: number;
  loading: boolean;
  userId: string;
  canRun: boolean;
  /** Seeded runs on illustrative data are labelled so. */
  error?: string | null;
  onView: (run: SimulationRun) => void;
  onMap: (run: SimulationRun) => void;
  onReport?: (run: SimulationRun) => void;
  onCancel: (run: SimulationRun) => void;
  onRunAgain: (run: SimulationRun) => void;
  onCompare: () => void;
  onStartFirst: () => void;
}

const selectCls = 'px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary';
const COLS = 'grid-cols-[28px_minmax(0,2.4fr)_minmax(0,1fr)_80px_64px_110px_minmax(0,1.1fr)_minmax(0,1.2fr)_72px_168px]';

function RowAction({ label, icon: Icon, onClick, danger }: {label: string;icon: typeof X;onClick: () => void;danger?: boolean;}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`p-2 rounded-lg transition-colors ${danger ? 'text-text-secondary hover:text-danger hover:bg-danger/10' : 'text-text-secondary hover:text-primary hover:bg-hover'}`}>
      
      <Icon size={16} />
    </button>);

}

export function RunHistory({ h, totalRuns, loading, userId, canRun, error, onView, onMap, onReport, onCancel, onRunAgain, onCompare, onStartFirst }: RunHistoryProps) {
  const diseaseName = (id: string) => h.rows.find((r) => r.disease === id)?.presetName ?? id;
  const statuses: StatusFilter[] = ['all', 'queued', 'running', 'completed', 'failed', 'cancelled'];
  const n = h.selected.length;

  return (
    <section className="bg-surface rounded-xl border border-border">
      <div className="p-4 md:px-6 border-b border-border flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
          <input
            value={h.query}
            onChange={(e) => h.setQuery(e.target.value)}
            placeholder="Search by scenario name"
            aria-label="Search runs by scenario name"
            className="w-56 pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" />
          
        </div>
        <select value={h.status} onChange={(e) => h.setStatus(e.target.value as StatusFilter)} aria-label="Filter by status" className={selectCls}>
          {statuses.map((s) =>
          <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_LABELS[s]}</option>
          )}
        </select>
        <select value={h.disease} onChange={(e) => h.setDisease(e.target.value)} aria-label="Filter by disease" className={selectCls}>
          <option value="all">All diseases</option>
          {h.diseaseIds.map((id) =>
          <option key={id} value={id}>{diseaseName(id)}</option>
          )}
        </select>
        <div className="flex items-center gap-1.5">
          <input type="date" value={h.from} onChange={(e) => h.setFrom(e.target.value)} aria-label="Started from" className={selectCls} />
          <span className="text-[12px] text-text-secondary">to</span>
          <input type="date" value={h.to} onChange={(e) => h.setTo(e.target.value)} aria-label="Started until" className={selectCls} />
        </div>
        <label className="flex items-center gap-2 px-2 text-[13px] text-text-primary cursor-pointer select-none">
          <input type="checkbox" checked={h.onlyMine} onChange={(e) => h.setOnlyMine(e.target.checked)} className="w-4 h-4 accent-primary" />
          Only my runs
        </label>
        {h.filtersActive &&
        <button onClick={h.clear} className="text-[13px] font-semibold text-primary hover:underline px-2">Clear filters</button>
        }
      </div>

      <div className="px-4 md:px-6 py-3 border-b border-border flex flex-wrap items-center justify-between gap-3 bg-background/50">
        <p className="text-[13px] text-text-secondary">
          {n === 0 ? 'Tick 2 or more completed runs to compare them.' : `${n} completed ${n === 1 ? 'run' : 'runs'} selected${n < 2 ? ' — pick one more to compare' : ''}.`}
        </p>
        <div className="flex items-center gap-3">
          {n > 0 && <button onClick={h.clearSelection} className="text-[13px] font-semibold text-text-secondary hover:text-text-primary">Clear</button>}
          <button
            onClick={onCompare}
            disabled={n < 2}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            
            <GitCompare size={15} /> Compare selected
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1180px]">
          <div className={`grid ${COLS} gap-3 px-6 py-3 border-b border-border text-[11px] font-semibold text-text-secondary uppercase tracking-wide`}>
            <span className="sr-only">Select</span>
            <span>Scenario</span>
            <span>Disease</span>
            <span>Horizon</span>
            <span>Initial</span>
            <span>Status</span>
            <span>Requested by</span>
            <span>Started</span>
            <span>Duration</span>
            <span className="text-right">Actions</span>
          </div>

          {error ?
          <p className="px-6 py-10 text-center text-[13px] text-danger">Runs couldn’t be loaded: {error}</p> :
          loading ?
          <ul aria-busy="true" aria-label="Loading runs">
              {[0, 1, 2, 3, 4].map((i) =>
            <li key={i} className={`grid ${COLS} gap-3 px-6 py-4 border-b border-border last:border-0 animate-pulse items-center`}>
                  <div className="h-4 w-4 rounded bg-surface-2" />
                  <div className="h-3.5 w-4/5 rounded bg-surface-2" />
                  {[0, 1, 2, 3, 4, 5, 6].map((j) =>
              <div key={j} className="h-3.5 w-2/3 rounded bg-surface-2" />
              )}
                  <div className="h-7 w-20 rounded bg-surface-2 justify-self-end" />
                </li>
            )}
            </ul> :
          h.rows.length === 0 ?
          <div className="px-6 py-16 text-center">
              <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-3">
                <History size={20} className="text-primary" />
              </span>
              {totalRuns === 0 ?
            <>
                  <h2 className="text-h3 text-text-primary">No simulations yet</h2>
                  <p className="text-[13px] text-text-secondary mt-1">{canRun ? 'Run your first scenario.' : 'Runs on scenarios shared with you will appear here.'}</p>
                  {canRun &&
              <button onClick={onStartFirst} className="mt-4 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors">
                      Run a scenario
                    </button>
              }
                </> :

            <>
                  <h2 className="text-h3 text-text-primary">No runs match these filters</h2>
                  <button onClick={h.clear} className="mt-3 text-[13px] font-semibold text-primary hover:underline">Clear filters</button>
                </>
            }
            </div> :

          <ul>
              {h.rows.map((r) => {
              const selectable = r.status === 'completed';
              const checked = h.selected.includes(r.id);
              return (
                <li key={r.id} className={`grid ${COLS} gap-3 px-6 py-3.5 border-b border-border last:border-0 items-center ${checked ? 'bg-hover/60' : ''}`}>
                    <input
                    type="checkbox"
                    checked={checked}
                    disabled={!selectable}
                    onChange={() => h.toggle(r.id)}
                    aria-label={`Select ${r.scenarioName} for comparison`}
                    title={selectable ? undefined : 'Only completed runs can be compared'}
                    className="w-4 h-4 accent-primary disabled:opacity-30" />
                  
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-text-primary truncate">{r.scenarioName}</p>
                      <p className="text-[12px] text-text-secondary">{r.id} · {MODEL_LABELS[r.modelType]}</p>
                      {r.status === 'completed' && r.summary?.ranges &&
                    <p className="text-[11px] text-text-secondary tabular-nums truncate" title="Median (5–95% of runs)">
                          Cases {formatRange(r.summary.ranges.finalCases)} · Deaths {formatRange(r.summary.ranges.finalDeaths)} · Takes off {formatPct(r.summary.ranges.pTakeOff)}
                        </p>
                    }
                      {r.status === 'failed' && r.error && <p className="text-[11px] text-danger truncate" title={r.error}>{r.error}</p>}
                    </div>
                    <span className="text-[13px] text-text-primary truncate">
                      {r.presetName ?? '—'}
                      {r.provisional && <span className="block text-[11px] text-warning">Provisional</span>}
                    </span>
                    <span className="text-[13px] text-text-primary tabular-nums">{r.horizonDays} days</span>
                    <span className="text-[13px] text-text-primary tabular-nums">{r.initialCases}</span>
                    <span>
                      <RunStatusBadge status={r.status} />
                    </span>
                    <span className="text-[13px] text-text-primary truncate">{r.requestedById === userId ? 'You' : r.requestedBy}</span>
                    <span className="text-[13px] text-text-secondary tabular-nums">{formatStarted(r.startedAt)}</span>
                    <span className="text-[13px] text-text-secondary tabular-nums">
                      {r.durationSec !== null ? formatDuration(r.durationSec) : isActive(r.status) ? `${Math.round(r.progress * 100)}%` : '—'}
                    </span>
                    <div className="flex items-center justify-end gap-0.5">
                      {r.status === 'completed' && <RowAction label="View results" icon={BarChart3} onClick={() => onView(r)} />}
                      {r.status === 'completed' && r.modelType === 'seihfr_geo' && <RowAction label="Open on map" icon={MapIcon} onClick={() => onMap(r)} />}
                      {r.status === 'completed' && onReport && <RowAction label="Add to report" icon={FileText} onClick={() => onReport(r)} />}
                      {isActive(r.status) && canRun && <RowAction label="Cancel run" icon={X} danger onClick={() => onCancel(r)} />}
                      {canRun && !isActive(r.status) && <RowAction label="Run again" icon={RotateCcw} onClick={() => onRunAgain(r)} />}
                    </div>
                  </li>);

            })}
            </ul>
          }
        </div>
      </div>
    </section>);

}