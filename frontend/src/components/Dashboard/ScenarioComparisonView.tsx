import { GitCompare } from 'lucide-react';
import { Link } from 'react-router-dom';

// The dashboard's comparison mode used to draw invented curves. Comparison now lives on its own page and
// only uses completed simulation runs (docs Module 12), so this view points there instead.
export function ScenarioComparisonView() {
  return (
    <section className="bg-surface rounded-xl border border-border p-10 flex flex-col items-center text-center">
      <span className="w-12 h-12 rounded-xl bg-hover text-primary flex items-center justify-center mb-4">
        <GitCompare size={22} />
      </span>
      <h2 className="text-h3 text-text-primary">Compare completed runs</h2>
      <p className="text-[13px] text-text-secondary mt-1 max-w-sm">
        Put up to three completed simulation runs side by side, with ranges and a capacity check.
      </p>
      <Link
        to="/scenario"
        className="mt-5 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors">
        Open Scenario Comparison
      </Link>
    </section>);

}
