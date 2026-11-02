import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { InterventionType, PackageItem } from '../../types/interventions';
import { pct } from '../../utils/interventions';
import { MechanismBadge } from './MechanismBadge';

interface ItemEditorProps {
  types: InterventionType[];
  item: PackageItem | null;
  onSave: (item: PackageItem) => void;
  onCancel: () => void;
}

const inputCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none tabular-nums disabled:opacity-50 ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;

const labelCls = 'block text-[13px] font-medium text-text-primary mb-1.5';

export function ItemEditor({ types, item, onSave, onCancel }: ItemEditorProps) {
  const [typeId, setTypeId] = useState(item?.typeId ?? types[0]?.id ?? '');
  const [start, setStart] = useState(String(item?.startDay ?? 0));
  const [end, setEnd] = useState(item?.endDay != null ? String(item.endDay) : '');
  const [ongoing, setOngoing] = useState(item ? item.endDay === null : false);
  const [coverage, setCoverage] = useState(Math.round((item?.coverage ?? 0.7) * 100));
  const [useCustom, setUseCustom] = useState(item?.customEffect != null);
  const type = types.find((t) => t.id === typeId);
  const [custom, setCustom] = useState(Math.round((item?.customEffect ?? type?.defaultEffect ?? 0.3) * 100));
  const [tried, setTried] = useState(false);

  const startN = Number(start);
  const endN = Number(end);
  const errors = {
    start: start.trim() === '' || !Number.isInteger(startN) || startN < 0 ? 'Enter a whole day, 0 or more.' : startN > 730 ? 'Start day must be 730 or less.' : '',
    end: ongoing ?
    '' :
    end.trim() === '' || !Number.isInteger(endN) || endN < 0 ?
    'Enter a whole day, or switch on “Ongoing”.' :
    !errorsStart(start) && endN < startN ?
    'End day can’t be before the start day.' :
    endN > 730 ?
    'End day must be 730 or less.' :
    ''
  };
  const valid = !!type && !errors.start && !errors.end;
  const effect = useCustom ? custom / 100 : type?.defaultEffect ?? 0;
  const reduction = coverage / 100 * effect;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid || !type) return;
    onSave({
      id: item?.id ?? `item-${Date.now()}`,
      typeId,
      startDay: startN,
      endDay: ongoing ? null : endN,
      coverage: coverage / 100,
      customEffect: useCustom ? custom / 100 : null
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        onClick={onCancel} />
      
      <motion.form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="item-editor-title"
        className="relative bg-surface border border-border rounded-xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
        
        <div className="px-6 py-5 border-b border-border flex items-center justify-between">
          <h2 id="item-editor-title" className="text-h3 text-text-primary">
            {item ? 'Edit intervention' : 'Add intervention'}
          </h2>
          <button type="button" onClick={onCancel} aria-label="Close" className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label htmlFor="item-type" className={labelCls}>Intervention type</label>
            <select
              id="item-type"
              value={typeId}
              onChange={(e) => {
                setTypeId(e.target.value);
                const t = types.find((x) => x.id === e.target.value);
                if (t && !useCustom) setCustom(Math.round(t.defaultEffect * 100));
              }}
              className={inputCls()}>
              
              {types.map((t) =>
              <option key={t.id} value={t.id}>
                  {t.name} · {t.mechanism === 'rate' ? 'Rate multiplier' : 'Compartment shift'}
                </option>
              )}
            </select>
            {type &&
            <div className="mt-2 flex items-center gap-2">
                <MechanismBadge mechanism={type.mechanism} />
                <span className="text-[12px] text-text-secondary">Default effect {pct(type.defaultEffect)}</span>
              </div>
            }
          </div>

          <fieldset>
            <legend className={labelCls}>Timing</legend>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="item-start" className="block text-[12px] text-text-secondary mb-1">Start day</label>
                <input id="item-start" inputMode="numeric" value={start} onChange={(e) => setStart(e.target.value)} aria-invalid={tried && !!errors.start} className={inputCls(tried || start !== '' ? errors.start : '')} />
                {(tried || start !== '') && errors.start && <p className="text-[12px] text-danger mt-1.5">{errors.start}</p>}
              </div>
              <div>
                <label htmlFor="item-end" className="block text-[12px] text-text-secondary mb-1">End day</label>
                <input
                  id="item-end"
                  inputMode="numeric"
                  value={ongoing ? '' : end}
                  placeholder={ongoing ? 'Ongoing' : ''}
                  disabled={ongoing}
                  onChange={(e) => setEnd(e.target.value)}
                  aria-invalid={!!errors.end && (tried || end !== '')}
                  className={inputCls(tried || end !== '' ? errors.end : '')} />
                
                {(tried || end !== '') && errors.end && <p className="text-[12px] text-danger mt-1.5">{errors.end}</p>}
              </div>
            </div>
            <label className="mt-3 inline-flex items-center gap-2 cursor-pointer">
              <Toggle checked={ongoing} onChange={setOngoing} label="Ongoing" />
              <span className="text-[13px] text-text-primary">Ongoing (runs until the end of the simulation)</span>
            </label>
            <p className="text-[12px] text-text-secondary mt-2">Days are counted from the start of the simulation, not calendar dates.</p>
          </fieldset>

          <div>
            <div className="flex items-baseline justify-between">
              <label htmlFor="item-coverage" className={labelCls}>Coverage / adherence</label>
              <span className="text-[14px] font-semibold text-text-primary tabular-nums">{coverage}%</span>
            </div>
            <input id="item-coverage" type="range" min={0} max={100} value={coverage} onChange={(e) => setCoverage(Number(e.target.value))} className="w-full accent-primary" />
            <p className="text-[12px] text-text-secondary mt-1">The share of people the intervention actually reaches or who follow it.</p>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <Toggle checked={useCustom} onChange={setUseCustom} label="Use a custom effect size for this item" />
              <span className="text-[13px] font-medium text-text-primary">Use a custom effect size for this item</span>
            </label>
            {useCustom ?
            <div className="mt-3">
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} value={custom} onChange={(e) => setCustom(Number(e.target.value))} aria-label="Custom effect size" className="flex-1 accent-primary" />
                  <span className="text-[14px] font-semibold text-text-primary tabular-nums w-12 text-right">{custom}%</span>
                </div>
                <p className="text-[12px] text-text-secondary mt-1">This only changes this item, not the type or other packages.</p>
              </div> :

            <p className="text-[12px] text-text-secondary mt-2">Using default effect size: {type ? pct(type.defaultEffect) : '—'}</p>
            }
          </div>

          <div className="rounded-xl bg-background border border-border p-4">
            <p className="text-[12px] text-text-secondary">Effective reduction = coverage × effect size</p>
            <p className="text-[15px] text-text-primary mt-1 tabular-nums">
              {coverage}% × {Math.round(effect * 100)}% = <span className="text-[20px] font-bold text-primary">{pct(reduction)}</span>
            </p>
            <p className="text-[12px] text-text-secondary mt-1">
              {type?.mechanism === 'shift' ?
              `About ${pct(reduction)} of susceptible people become protected over the active days.` :
              `Spread is about ${pct(reduction)} lower while this is active.`}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
            Cancel
          </button>
          <button type="submit" className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold transition-colors">
            {item ? 'Update item' : 'Add to package'}
          </button>
        </div>
      </motion.form>
    </div>);

}

function errorsStart(start: string) {
  const n = Number(start);
  return start.trim() === '' || !Number.isInteger(n) || n < 0;
}

function Toggle({ checked, onChange, label }: {checked: boolean;onChange: (v: boolean) => void;label: string;}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${checked ? 'bg-primary' : 'bg-surface-2 border border-border'}`}>
      
      <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-150 ease-out ${checked ? 'translate-x-4' : ''}`} />
    </button>);

}