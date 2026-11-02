import { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';

// Shared loading / error / honesty labels for the officer and admin pages. Pill style matches
// the existing "Illustrative data" badge on the Geographic page.

const PILL = 'inline-flex items-center px-2.5 py-1 rounded-full bg-surface-2 border border-border text-[12px] font-semibold text-text-secondary';

/** Seeded sample records that nobody entered. */
export function IllustrativeBadge({ className = '' }: {className?: string;}) {
  return (
    <span className={`${PILL} ${className}`} title="Seeded sample record for the demo, not real data">
      Illustrative data
    </span>);

}

/** Parts of a page that are not backed by the API (P2). */
export function DemoDataBadge({ className = '', title }: {className?: string;title?: string;}) {
  return (
    <span className={`${PILL} ${className}`} title={title ?? 'Not stored by the server yet; shown as sample content'}>
      Demo data
    </span>);

}

interface QueryStateProps {
  isLoading: boolean;
  error?: Error | null;
  children: ReactNode;
}

/** Renders a loading line or a readable error in place of the page body. */
export function QueryState({ isLoading, error, children }: QueryStateProps) {
  if (isLoading)
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-text-secondary">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>);

  if (error)
  return (
    <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-5 py-4">
        <AlertTriangle size={18} className="text-danger mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-text-primary">
          <span className="font-semibold">Couldn’t load this page.</span>{' '}
          <span className="text-text-secondary">{error.message}</span>
        </p>
      </div>);

  return <>{children}</>;
}
