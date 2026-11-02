import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3 } from 'lucide-react';

/** Placeholder for the results dashboard of one run; the results phase replaces it. */
export function RunResults() {
  const { runId } = useParams();
  const navigate = useNavigate();
  return (
    <div className="max-w-[1440px] mx-auto space-y-6">
      <button
        onClick={() => navigate('/simulation')}
        className="flex items-center gap-1.5 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
        <ArrowLeft size={16} />
        Back to Simulations
      </button>
      <div className="bg-surface rounded-xl border border-border shadow-card p-10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
          <BarChart3 size={22} />
        </div>
        <h2 className="text-h2 text-text-primary mb-2">Results for {runId}</h2>
        <p className="text-body text-text-secondary max-w-md">
          The results dashboard for this run is being connected to the server and will be available in the next phase.
        </p>
      </div>
    </div>);

}
