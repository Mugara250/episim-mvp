import React from 'react';
import { RunStatus } from '../../types/simulationRuns';
import { STATUS_LABELS } from '../../utils/simulationRuns';

const TONES: Record<RunStatus, string> = {
  queued: 'bg-surface-2 text-text-secondary',
  running: 'bg-primary/10 text-primary',
  completed: 'bg-success/15 text-success',
  failed: 'bg-danger/15 text-danger',
  cancelled: 'bg-surface-2 text-text-secondary'
};

export function RunStatusBadge({ status }: {status: RunStatus;}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${TONES[status]}`}>
      {status === 'running' && <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" aria-hidden />}
      {STATUS_LABELS[status]}
    </span>);

}