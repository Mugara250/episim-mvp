import { Info } from 'lucide-react';

export function AdminScopeNote() {
  return (
    <div role="note" className="flex items-start gap-3 rounded-xl border border-border bg-surface px-5 py-3.5 mb-6">
      <Info size={16} className="text-primary mt-0.5 flex-shrink-0" />
      <p className="text-[13px] text-text-secondary">
        <span className="font-semibold text-text-primary">Admins manage people, hospitals and the system.</span>{' '}
        You can’t run simulations or approve reports. These belong to Epidemiologists.
      </p>
    </div>);

}