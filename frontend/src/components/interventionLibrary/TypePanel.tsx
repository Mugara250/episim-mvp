import React from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Copy, Eye, Loader2, Lock, ShieldCheck, X } from 'lucide-react';
import { MECHANISM_HELP, MECHANISM_LABELS } from '../../data/interventions';
import { InterventionTypesState } from '../../hooks/useInterventionTypes';
import { EffectMechanism } from '../../types/interventions';
import { MechanismBadge } from './MechanismBadge';

const inputCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;

const labelCls = 'block text-[13px] font-medium text-text-primary mb-1.5';
const readCls = 'px-3 py-2.5 rounded-lg bg-background border border-border text-[14px] text-text-primary';

export function TypePanel({ s }: {s: InterventionTypesState;}) {
  const open = s.openId !== null;
  const t = s.opened;
  const d = s.draft;
  const e = s.errors;
  const ro = !s.editable;
  const builtIn = !!t?.builtIn;
  const locked = builtIn && !s.canEditBuiltIns;
  const effectNum = Number(d.defaultEffect);

  // Rendered into <body> so the panel sits above the top bar and isn't clipped by the animated page wrapper.
  return createPortal(
    <AnimatePresence>
      {open &&
      <>
          <motion.div
          key="scrim"
          className="fixed inset-0 z-[70] bg-black/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          onClick={s.close} />
        
          <motion.aside
          key="panel"
          role="dialog"
          aria-modal="true"
          aria-labelledby="type-panel-title"
          className="fixed inset-y-0 right-0 z-[80] h-[100dvh] w-full max-w-[480px] bg-surface border-l border-border flex flex-col shadow-2xl"
          initial={{ x: 32, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 32, opacity: 0 }}
          transition={{ duration: 0.24, ease: [0.23, 1, 0.32, 1] }}>
          
            <div className="p-6 border-b border-border">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {builtIn && <Lock size={15} className="text-text-secondary" aria-hidden />}
                    <h2 id="type-panel-title" className="text-h2 text-text-primary truncate">
                      {s.isNew ? d.name.trim() || 'New intervention type' : t?.name}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${builtIn ? 'bg-surface-2 text-text-secondary' : 'bg-hover text-primary'}`}>
                      {builtIn ? 'Built-in' : 'Custom'}
                    </span>
                    {t?.placeholder && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Placeholder values</span>}
                    {s.dirty &&
                  <span className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
                        <span className="w-2 h-2 rounded-full bg-warning" /> Unsaved changes
                      </span>
                  }
                  </div>
                </div>
                <button onClick={s.close} aria-label="Close" className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors">
                  <X size={18} />
                </button>
              </div>
              {locked &&
            <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
                  <ShieldCheck size={15} className="text-primary mt-0.5 flex-shrink-0" />
                  Built-in types are reference values and can’t be edited.
                </p>
            }
              {builtIn && s.canEditBuiltIns && s.canEdit &&
            <p className="mt-4 flex items-start gap-2 text-[13px] text-warning">
                  <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
                  You have permission to edit built-in types. Changes affect every package that uses this type’s default.
                </p>
            }
              {!s.canEdit &&
            <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
                  <Eye size={15} className="mt-0.5 flex-shrink-0" />
                  View only. Epidemiologists and Administrators can create and edit intervention types.
                </p>
            }
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div>
                <label htmlFor="type-name" className={labelCls}>Name</label>
                {ro ?
              <div className={readCls}>{d.name}</div> :

              <>
                    <input id="type-name" value={d.name} onChange={(ev) => s.setName(ev.target.value)} placeholder="e.g. Case isolation" aria-invalid={!!e.name} className={inputCls(e.name)} />
                    {e.name && <p className="text-[12px] text-danger mt-1.5">{e.name}</p>}
                  </>
              }
              </div>

              <div>
                <label htmlFor="type-key" className={labelCls}>Key</label>
                {ro ?
              <div className={`${readCls} font-mono text-[13px]`}>{d.key}</div> :

              <>
                    <input id="type-key" value={d.key} onChange={(ev) => s.setDraft({ ...d, key: ev.target.value })} aria-invalid={!!e.key} className={`${inputCls(e.key)} font-mono text-[13px]`} />
                    <p className={`text-[12px] mt-1.5 ${e.key ? 'text-danger' : 'text-text-secondary'}`}>
                      {e.key || 'A short unique ID used in exported scenario files.'}
                    </p>
                  </>
              }
              </div>

              <div>
                <span className={labelCls}>Effect mechanism</span>
                {ro ?
              <div className="space-y-2">
                    <MechanismBadge mechanism={d.mechanism} tooltip={false} />
                    <p className="text-[12px] text-text-secondary">{MECHANISM_HELP[d.mechanism]}</p>
                  </div> :

              <div className="grid gap-2" role="radiogroup" aria-label="Effect mechanism">
                    {(Object.keys(MECHANISM_LABELS) as EffectMechanism[]).map((m) =>
                <label
                  key={m}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  d.mechanism === m ? 'border-primary/50 bg-hover' : 'border-border hover:border-primary/30'}`
                  }>
                  
                        <input type="radio" name="mechanism" className="mt-1 accent-primary" checked={d.mechanism === m} onChange={() => s.setDraft({ ...d, mechanism: m })} />
                        <span>
                          <span className="block text-[13px] font-semibold text-text-primary">{MECHANISM_LABELS[m]}</span>
                          <span className="block text-[12px] text-text-secondary mt-0.5">{MECHANISM_HELP[m]}</span>
                        </span>
                      </label>
                )}
                  </div>
              }
              </div>

              <div>
                <label htmlFor="type-effect" className={labelCls}>
                  Default effect size <span className="text-text-secondary font-normal">(0 to 100%)</span>
                </label>
                {ro ?
              <div className={`${readCls} tabular-nums`}>{d.defaultEffect}%</div> :

              <>
                    <div className="flex items-center gap-4">
                      <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={Number.isFinite(effectNum) ? Math.min(100, Math.max(0, effectNum)) : 0}
                    onChange={(ev) => s.setDraft({ ...d, defaultEffect: ev.target.value })}
                    aria-label="Default effect size slider"
                    className="flex-1 accent-primary" />
                  
                      <div className="relative w-24">
                        <input
                      id="type-effect"
                      inputMode="decimal"
                      value={d.defaultEffect}
                      onChange={(ev) => s.setDraft({ ...d, defaultEffect: ev.target.value })}
                      aria-invalid={!!e.defaultEffect}
                      className={`${inputCls(e.defaultEffect)} pr-7 tabular-nums text-right`} />
                    
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[13px] text-text-secondary">%</span>
                      </div>
                    </div>
                    <p className={`text-[12px] mt-1.5 ${e.defaultEffect ? 'text-danger' : 'text-text-secondary'}`}>
                      {e.defaultEffect || (
                  d.mechanism === 'rate' ?
                  `At full coverage, spread drops by ${d.defaultEffect || 0}% while this is active.` :
                  `At full coverage, ${d.defaultEffect || 0}% of people reached become protected.`)}
                    </p>
                  </>
              }
              </div>

              <div>
                <label htmlFor="type-source" className={labelCls}>Source / citation</label>
                {ro ?
              <div className={`${readCls} text-[13px] whitespace-pre-wrap`}>{d.source || <span className="text-warning">No source given</span>}</div> :

              <>
                    <textarea
                  id="type-source"
                  rows={4}
                  value={d.source}
                  onChange={(ev) => s.setDraft({ ...d, source: ev.target.value })}
                  placeholder="The study or report the effect size comes from"
                  className={`${inputCls()} resize-y text-[13px]`} />
                
                    <p className={`text-[12px] mt-1.5 ${d.source.trim() ? 'text-text-secondary' : 'text-warning'}`}>
                      Cite where the effect size comes from, so others can check it.
                    </p>
                  </>
              }
              </div>

              {t?.placeholder &&
            <p className="text-[12px] text-text-secondary">
                  This effect size is an illustrative placeholder. Replace it with a sourced value before using results for decisions.
                </p>
            }
            </div>

            <div className="p-5 border-t border-border flex justify-end gap-2">
              {s.editable && s.dirty ?
            <>
                  <button onClick={s.discard} disabled={s.saving} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50">
                    Discard
                  </button>
                  <button
                onClick={s.save}
                disabled={s.saving}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-70 disabled:cursor-wait">
                
                    {s.saving && <Loader2 size={14} className="animate-spin" />}
                    {s.saving ? 'Saving…' : s.isNew ? 'Create type' : 'Save changes'}
                  </button>
                </> :
            s.canEdit && t ?
            <button
              onClick={() => s.clone(t)}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors ${
              locked ? 'bg-primary hover:bg-primary-dark text-white' : 'border border-border text-text-primary hover:border-primary/40'}`
              }>
              
                  <Copy size={15} /> Clone as custom
                </button> :

            <button onClick={s.close} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
                  Close
                </button>
            }
            </div>
          </motion.aside>
        </>
      }
    </AnimatePresence>,
    document.body
  );
}