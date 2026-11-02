import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Scenario } from '../../types/scenarios';

export function DeleteScenarioDialog({ scenario, onCancel, onConfirm }: {scenario: Scenario;onCancel: () => void;onConfirm: () => void;}) {
  return createPortal(
    <div className="fixed inset-0 z-[90] bg-black/50 flex items-center justify-center p-4" onClick={onCancel}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="del-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl border border-border w-full max-w-md shadow-2xl p-6">
        
        <span className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center mb-4">
          <Trash2 size={18} className="text-danger" />
        </span>
        <h2 id="del-title" className="text-h3 text-text-primary">Delete “{scenario.name}”?</h2>
        <p className="text-[13px] text-text-secondary mt-2">
          {scenario.shares.length ?
          `It’s shared with ${scenario.shares.length} ${scenario.shares.length === 1 ? 'person or institution' : 'people or institutions'}; they’ll lose access. ` :
          ''}
          Copies others have cloned are not affected. This can’t be undone.
        </p>
        <div className="flex justify-end gap-3 mt-6">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2.5 rounded-lg bg-danger text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
            Delete scenario
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}