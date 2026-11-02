import { InstructionStatus } from '../../types/officer';

export const INSTRUCTION_STATUSES: InstructionStatus[] = ['Not started', 'In progress', 'Done', "Can't do"];

const TONES: Record<InstructionStatus, string> = {
  'Not started': 'bg-surface-2 text-text-secondary',
  'In progress': 'bg-hover text-primary',
  Done: 'bg-success/15 text-success',
  "Can't do": 'bg-danger/15 text-danger'
};

export function InstructionStatusBadge({ status }: {status: InstructionStatus;}) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${TONES[status]}`}>
      {status}
    </span>);

}