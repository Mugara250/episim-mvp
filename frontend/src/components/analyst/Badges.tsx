export type DatasetStatus = 'Passed' | 'Warnings' | 'Failed';
export type ScenarioStatus = 'Completed' | 'Running' | 'Queued' | 'Saved' | 'Failed' | 'Cancelled';
export type DraftStatus = 'Draft' | 'Pending approval' | 'Approved';

const base = 'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap';

export function DatasetStatusBadge({ status }: {status: DatasetStatus;}) {
  const tone =
  status === 'Passed' ?
  'bg-success/15 text-success' :
  status === 'Warnings' ?
  'bg-warning/15 text-warning' :
  'bg-danger/15 text-danger';
  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function ScenarioStatusBadge({ status }: {status: ScenarioStatus;}) {
  const tone =
  status === 'Completed' ?
  'bg-success/15 text-success' :
  status === 'Running' || status === 'Queued' ?
  'bg-hover text-primary' :
  status === 'Failed' ?
  'bg-danger/15 text-danger' :
  'bg-surface-2 text-text-secondary';
  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function DraftStatusBadge({ status }: {status: DraftStatus;}) {
  const tone =
  status === 'Approved' ?
  'bg-success/15 text-success' :
  status === 'Pending approval' ?
  'bg-warning/15 text-warning' :
  'bg-surface-2 text-text-secondary';
  return <span className={`${base} ${tone}`}>{status}</span>;
}

export function ViewOnlyBadge() {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary border border-border">
      View only
    </span>);

}