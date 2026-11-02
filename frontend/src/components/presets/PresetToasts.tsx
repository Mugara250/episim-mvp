import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, Loader2, X } from 'lucide-react';
import { PresetToast } from '../../types/presets';

export function PresetToasts({ toasts, onDismiss }: {toasts: PresetToast[];onDismiss: (id: number) => void;}) {
  return createPortal(
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 w-[340px] max-w-[calc(100vw-48px)]" role="status" aria-live="polite">
      {toasts.map((t) =>
      <div
        key={t.id}
        className={`flex items-start gap-3 px-4 py-3 rounded-xl border bg-surface shadow-card ${
        t.tone === 'error' ? 'border-danger/40' : t.tone === 'success' ? 'border-success/40' : 'border-border'}`
        }>
        
          {t.tone === 'loading' && <Loader2 size={17} className="text-primary animate-spin mt-0.5 flex-shrink-0" />}
          {t.tone === 'success' && <CheckCircle2 size={17} className="text-success mt-0.5 flex-shrink-0" />}
          {t.tone === 'error' && <AlertCircle size={17} className="text-danger mt-0.5 flex-shrink-0" />}
          {t.tone === 'info' && <Info size={17} className="text-primary mt-0.5 flex-shrink-0" />}
          <p className="flex-1 text-[13px] text-text-primary">{t.text}</p>
          {t.tone !== 'loading' &&
        <button onClick={() => onDismiss(t.id)} aria-label="Dismiss" className="text-text-secondary hover:text-text-primary">
              <X size={15} />
            </button>
        }
        </div>
      )}
    </div>,
    document.body
  );
}