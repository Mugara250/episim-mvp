import { Link } from 'react-router-dom';
import { Info } from 'lucide-react';
import { useDemoMode } from '../../api/meta';

/** Slim notice shown on every page while the server runs in DEMO_MODE. */
export function DemoRibbon() {
  const demo = useDemoMode();
  if (!demo) return null;
  return (
    <div
      role="note"
      className="w-full flex-shrink-0 bg-amber-50 border-b border-amber-200 text-amber-900 text-[12px] px-4 py-1.5 flex items-center justify-center gap-2 text-center">
      <Info size={13} className="flex-shrink-0" />
      <span>
        <span className="font-semibold">Demo</span> — scenario estimates, not forecasts · sample data is illustrative ·{' '}
        <Link to="/about" className="font-semibold underline underline-offset-2 hover:text-amber-700">
          About this demo
        </Link>
      </span>
    </div>);

}
