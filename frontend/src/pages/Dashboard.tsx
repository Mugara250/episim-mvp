import { Loader2 } from 'lucide-react';
import { RunDashboard, useLatestCompletedRun } from './RunResults';

// Role-default dashboard (used when a role has no dashboard of its own). The prototype version drew
// invented forecast numbers; it now shows the most recent completed simulation run, or says there is none.
export function Dashboard({ onNavigate }: {onNavigate?: (route: string, reportId?: string) => void;}) {
  const { run, isLoading, error } = useLatestCompletedRun();
  return (
    <div className="max-w-[1600px] mx-auto space-y-5 pb-12">
      {isLoading ?
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-text-secondary">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div> :
      run ?
      <RunDashboard runId={run.id} /> :

      <div className="bg-surface rounded-xl border border-border p-10 text-center">
          <h1 className="text-h2 text-text-primary">No simulation results yet</h1>
          <p className="text-[13px] text-text-secondary mt-1">
            {error ? error.message : 'Results appear here once a simulation run completes. Nothing on this page is invented.'}
          </p>
          {onNavigate &&
        <button onClick={() => onNavigate('/simulation')} className="mt-4 text-[13px] font-semibold text-primary hover:underline">
              Go to Simulations
            </button>
        }
        </div>
      }
    </div>);

}
