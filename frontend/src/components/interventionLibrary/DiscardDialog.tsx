import { createPortal } from 'react-dom';

export function DiscardDialog({ onKeep, onDiscard }: {onKeep: () => void;onDiscard: () => void;}) {
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="discard-title">
      <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-card">
        <h2 id="discard-title" className="text-h3 text-text-primary">Discard unsaved changes?</h2>
        <p className="text-[13px] text-text-secondary mt-2">Your changes haven’t been saved and will be lost.</p>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onKeep} autoFocus className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
            Keep editing
          </button>
          <button onClick={onDiscard} className="px-4 py-2.5 rounded-lg bg-danger text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
            Discard changes
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}