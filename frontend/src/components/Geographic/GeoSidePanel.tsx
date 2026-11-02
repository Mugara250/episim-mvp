import { Info } from 'lucide-react';
import { GeoState } from '../../hooks/useGeographicSpread';
import { DistrictSummary } from './DistrictSummary';
import { GeoExportMenu } from './GeoExportMenu';
import { TopRiskList } from './TopRiskList';

export function GeoSidePanel({ g, onExport }: {g: GeoState;onExport: (f: 'png' | 'csv') => void;}) {
  const movement = g.results?.movement;
  const away = movement?.params?.away_share;
  return (
    <aside className="bg-surface rounded-2xl border border-border shadow-card p-6 flex flex-col gap-6 min-w-0">
      <TopRiskList g={g} />
      <DistrictSummary g={g} />

      <label className="flex items-center justify-between gap-3 cursor-pointer">
        <span className="text-[14px] font-medium text-text-primary">Show movement between districts</span>
        <button
          role="switch"
          aria-checked={g.showLinks}
          onClick={() => g.setShowLinks(!g.showLinks)}
          className={`w-10 h-6 rounded-full relative flex-shrink-0 transition-colors duration-150 ${g.showLinks ? 'bg-primary' : 'bg-slate-300'}`}>
          <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-150 ${g.showLinks ? 'translate-x-5' : 'translate-x-1'}`} />
        </button>
      </label>

      <div className="flex items-center justify-between gap-3 pt-5 border-t border-border">
        <p className="relative group flex items-center gap-1.5 text-[12px] text-text-secondary">
          Movement is estimated (gravity model). It is the largest uncertainty.
          <button aria-describedby="geo-mobility-note" className="text-text-secondary hover:text-text-primary" aria-label="About movement data">
            <Info size={14} />
          </button>
          <span
            id="geo-mobility-note"
            role="tooltip"
            className="absolute left-0 bottom-full mb-2 w-72 rounded-lg bg-sidebar-bg text-white text-[12px] leading-snug p-3 hidden group-hover:block group-focus-within:block z-10">
            {movement?.note ?? movement?.label}
            {away !== undefined ? ` Assumes residents spend ${(away * 100).toFixed(0)}% of their time in other districts.` : ''} Changing this
            assumption moves arrival times more than most other settings. Lines show the 10 strongest estimated links.
          </span>
        </p>
        <GeoExportMenu onExport={onExport} />
      </div>
    </aside>);

}
