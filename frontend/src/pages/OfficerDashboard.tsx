import React from 'react';
import { AlertTriangle, ArrowRight, ChevronRight } from 'lucide-react';
import { useOfficer } from '../context/OfficerContext';
import { BedOccupancyChart } from '../components/officer/BedOccupancyChart';
import { InstructionStatusBadge } from '../components/officer/InstructionStatus';
import { ownHospital } from '../data/hospital';
import { formatDay, latestBeds, latestFor, OCCUPANCY_WARNING } from '../utils/hospital';

export function OfficerDashboard({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { entries, instructions } = useOfficer();
  const go = (r: string) => onNavigate?.(r);
  const beds = latestBeds(entries);
  const occupancy = beds && beds.total > 0 ? beds.occupied / beds.total : 0;
  const high = occupancy >= OCCUPANCY_WARNING;
  const ebola = latestFor(entries, 'Ebola');
  const marburg = latestFor(entries, 'Marburg');
  const hcw = (ebola?.hcwInfected ?? 0) + (marburg?.hcwInfected ?? 0);
  const pending = instructions.filter((i) => i.status === 'Not started' || i.status === 'In progress');
  const latest = [...instructions].sort((a, b) => b.received.localeCompare(a.received)).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">{ownHospital.name}</h1>
        <p className="text-body text-text-secondary">
          {ownHospital.district} district · your hospital only. Counts are as reported by your team; projections are estimates with ranges.
        </p>
      </div>

      {high && beds &&
      <div role="alert" className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 px-5 py-4">
          <AlertTriangle size={18} className="text-warning mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-text-primary">
            <span className="font-semibold">Isolation beds are {Math.round(occupancy * 100)}% full.</span>{' '}
            <span className="text-text-secondary">Above 80%, new admissions may need to be referred. Check your response instructions.</span>
          </p>
        </div>
      }

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <button onClick={() => go('/healthcare')} className="text-left bg-surface p-5 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col">
          <div className="text-micro text-text-secondary mb-2">ISOLATION BEDS USED</div>
          <div className={`text-kpi ${high ? 'text-warning' : 'text-text-primary'}`}>
            {beds ? `${beds.occupied} / ${beds.total}` : '—'}
          </div>
          <div className="mt-auto pt-3">
            <div className="h-1.5 bg-background rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${high ? 'bg-warning' : 'bg-primary'}`} style={{ width: `${Math.min(100, occupancy * 100)}%` }} />
            </div>
            <div className="text-[12px] text-text-secondary mt-1.5">{beds ? `${Math.round(occupancy * 100)}% · ${formatDay(beds.date)}` : 'No entries yet'}</div>
          </div>
        </button>

        <button onClick={() => go('/healthcare')} className="text-left bg-surface p-5 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col">
          <div className="text-micro text-text-secondary mb-2">ACTIVE CASES</div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-kpi text-text-primary">{ebola?.inIsolation ?? 0}</div>
              <div className="text-[12px] text-text-secondary">Ebola</div>
            </div>
            <div>
              <div className="text-kpi text-text-primary">{marburg?.inIsolation ?? 0}</div>
              <div className="text-[12px] text-text-secondary">Marburg</div>
            </div>
          </div>
          <div className="text-[12px] text-text-secondary mt-auto pt-1">In isolation, latest report</div>
        </button>

        <button onClick={() => go('/health-workers')} className="text-left bg-surface p-5 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col">
          <div className="text-micro text-text-secondary mb-2">HEALTH WORKERS INFECTED</div>
          <div className={`text-kpi ${hcw > 0 ? 'text-danger' : 'text-text-primary'}`}>{hcw}</div>
          <div className="text-[12px] text-text-secondary mt-auto pt-1">
            Ebola {ebola?.hcwInfected ?? 0} · Marburg {marburg?.hcwInfected ?? 0} · to date
          </div>
        </button>

        <button onClick={() => go('/instructions')} className="text-left bg-surface p-5 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col">
          <div className="text-micro text-text-secondary mb-2">INSTRUCTIONS PENDING</div>
          <div className="text-kpi text-text-primary">{pending.length}</div>
          <div className="text-[12px] text-text-secondary mt-auto pt-1">
            {pending.filter((p) => p.status === 'Not started').length} not started · {pending.filter((p) => p.status === 'In progress').length} in progress
          </div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 items-start">
        <section className="bg-surface p-6 rounded-xl border border-border">
          <h2 className="text-h3 text-text-primary">Isolation bed occupancy</h2>
          <p className="text-[12px] text-text-secondary mt-1 mb-4">
            Reported beds in use, then a trend-based estimate for the next 14 days. The shaded band shows how uncertain it is.
          </p>
          <BedOccupancyChart entries={entries} />
        </section>

        <section className="bg-surface rounded-xl border border-border">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-h3 text-text-primary">Latest instructions</h2>
            <button onClick={() => go('/instructions')} className="text-[12px] font-semibold text-primary hover:underline flex items-center">
              All <ArrowRight size={13} className="ml-1" />
            </button>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {latest.map((i) =>
            <li key={i.id}>
                <button onClick={() => go('/instructions')} className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-background transition-colors">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-text-primary line-clamp-2">{i.action}</span>
                    <span className="block text-[12px] text-text-secondary mt-0.5">
                      {i.disease} · due {formatDay(i.deadline)}
                    </span>
                  </span>
                  <InstructionStatusBadge status={i.status} />
                  <ChevronRight size={15} className="text-text-secondary flex-shrink-0" />
                </button>
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>);

}