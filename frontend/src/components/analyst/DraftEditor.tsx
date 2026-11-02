import React, { useState } from 'react';
import { X } from 'lucide-react';
import { inputCls, labelCls } from '../models/chartTheme';
import { analystScenarios } from '../../data/analystScenarios';
import { DiseaseName, ReportDraft } from '../../types/analyst';

export function DraftEditor({
  draft,
  onClose,
  onSave




}: {draft: ReportDraft | null;onClose: () => void;onSave: (d: Omit<ReportDraft, 'id' | 'updated' | 'status'>) => void;}) {
  const [title, setTitle] = useState(draft?.title ?? '');
  const [disease, setDisease] = useState<DiseaseName>(draft?.disease ?? 'Ebola');
  const [scenarioId, setScenarioId] = useState(draft?.scenarioId ?? analystScenarios[0].id);
  const [summary, setSummary] = useState(draft?.summary ?? '');
  const options = analystScenarios.filter((s) => s.disease === disease);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), disease, scenarioId, summary: summary.trim() });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-title"
        className="bg-surface rounded-xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="draft-title" className="text-h3 text-text-primary">{draft ? 'Edit draft' : 'New report draft'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="dr-title" className={labelCls}>TITLE</label>
            <input id="dr-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dr-disease" className={labelCls}>DISEASE</label>
              <select
                id="dr-disease"
                className={inputCls}
                value={disease}
                onChange={(e) => {
                  const d = e.target.value as DiseaseName;
                  setDisease(d);
                  setScenarioId(analystScenarios.find((s) => s.disease === d)?.id ?? '');
                }}>
                
                <option>Ebola</option>
                <option>Marburg</option>
              </select>
            </div>
            <div>
              <label htmlFor="dr-scn" className={labelCls}>SCENARIO</label>
              <select id="dr-scn" className={inputCls} value={scenarioId} onChange={(e) => setScenarioId(e.target.value)}>
                {options.map((s) => <option key={s.id} value={s.id}>{s.id} · {s.name}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dr-summary" className={labelCls}>SUMMARY</label>
            <textarea
              id="dr-summary"
              rows={6}
              className={`${inputCls} resize-none`}
              value={summary}
              onChange={(e) => setSummary(e.target.value)} />
            
            <p className="text-[11px] text-text-secondary mt-1">
              Describe results as scenario estimates with their uncertainty range, not as exact predictions.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border bg-background/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim()}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            
            Save draft
          </button>
        </div>
      </form>
    </div>);

}