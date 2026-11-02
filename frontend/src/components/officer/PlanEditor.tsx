import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { inputCls, labelCls } from '../models/chartTheme';
import { OfficerDisease, PlanAction, PlanStatus, ResponsePlan } from '../../types/officer';

const ACTION_OPTIONS = [
'Isolating sick people',
'Extra isolation beds',
'Tracing and watching contacts',
'Safe burials',
'Protective equipment for health workers',
'Screening at triage',
'Community engagement'];


type PlanInput = Omit<ResponsePlan, 'id' | 'updated'>;

export function PlanEditor({
  plan,
  onClose,
  onSave




}: {plan: ResponsePlan | null;onClose: () => void;onSave: (p: PlanInput) => void;}) {
  const [title, setTitle] = useState(plan?.title ?? '');
  const [disease, setDisease] = useState<OfficerDisease>(plan?.disease ?? 'Ebola');
  const [status, setStatus] = useState<PlanStatus>(plan?.status ?? 'Draft');
  const [startDate, setStartDate] = useState(plan?.startDate ?? '2026-10-09');
  const [reviewDate, setReviewDate] = useState(plan?.reviewDate ?? '2026-10-16');
  const [actions, setActions] = useState<PlanAction[]>(plan?.actions ?? [{ name: ACTION_OPTIONS[0], target: '' }]);
  const [notes, setNotes] = useState(plan?.notes ?? '');

  const valid = title.trim() && actions.length > 0 && actions.every((a) => a.target.trim());
  const updateAction = (i: number, patch: Partial<PlanAction>) =>
  setActions((list) => list.map((a, idx) => idx === i ? { ...a, ...patch } : a));

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (valid) onSave({ title: title.trim(), disease, status, startDate, reviewDate, actions, notes: notes.trim() });
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-title"
        className="bg-surface rounded-xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="plan-title" className="text-h3 text-text-primary">{plan ? 'Edit response plan' : 'New response plan'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          <div>
            <label htmlFor="pl-title" className={labelCls}>PLAN NAME</label>
            <input id="pl-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Ebola isolation surge plan" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label htmlFor="pl-dis" className={labelCls}>DISEASE</label>
              <select id="pl-dis" className={inputCls} value={disease} onChange={(e) => setDisease(e.target.value as OfficerDisease)}>
                <option>Ebola</option>
                <option>Marburg</option>
              </select>
            </div>
            <div>
              <label htmlFor="pl-status" className={labelCls}>STATUS</label>
              <select id="pl-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as PlanStatus)}>
                <option>Draft</option>
                <option>Active</option>
              </select>
            </div>
            <div>
              <label htmlFor="pl-start" className={labelCls}>START</label>
              <input id="pl-start" type="date" className={inputCls} value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pl-review" className={labelCls}>REVIEW BY</label>
              <input id="pl-review" type="date" className={inputCls} value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} />
            </div>
          </div>

          <fieldset className="space-y-2">
            <legend className={labelCls}>ACTIONS AND TARGETS</legend>
            {actions.map((a, i) =>
            <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                <select aria-label={`Action ${i + 1}`} className={inputCls} value={a.name} onChange={(e) => updateAction(i, { name: e.target.value })}>
                  {ACTION_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <input
                aria-label={`Target for action ${i + 1}`}
                className={inputCls}
                value={a.target}
                onChange={(e) => updateAction(i, { target: e.target.value })}
                placeholder="Target, e.g. 8 beds" />
              
                <button
                type="button"
                onClick={() => setActions((list) => list.filter((_, idx) => idx !== i))}
                disabled={actions.length === 1}
                aria-label={`Remove action ${i + 1}`}
                className="p-2 text-text-secondary hover:text-danger transition-colors disabled:opacity-40">
                
                  <Trash2 size={15} />
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => setActions((list) => [...list, { name: ACTION_OPTIONS[0], target: '' }])}
              className="text-[12px] font-semibold text-primary hover:underline flex items-center">
              
              <Plus size={13} className="mr-1" /> Add action
            </button>
          </fieldset>

          <div>
            <label htmlFor="pl-notes" className={labelCls}>NOTES</label>
            <textarea id="pl-notes" rows={3} className={`${inputCls} resize-none`} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 p-5 border-t border-border bg-background/50 rounded-b-xl">
          <span className="text-[12px] text-text-secondary">{valid ? '' : 'Add a name and a target for every action.'}</span>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">Cancel</button>
            <button type="submit" disabled={!valid} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Save plan
            </button>
          </div>
        </div>
      </form>
    </div>);

}