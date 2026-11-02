import React from 'react';
import { AlertTriangle, Copy, Eye, Lock, PlayCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { ROUTE_HELP, ROUTE_LABELS } from '../../data/diseasePresets';
import { DiseasePresetsState } from '../../hooks/useDiseasePresets';
import { PresetDraft, TransmissionRoute } from '../../types/presets';
import { asPercent } from '../../utils/presets';
import { PresetField } from './PresetField';

const inputCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none tabular-nums ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;


interface PresetDetailProps {
  s: DiseasePresetsState;
  canStartScenario: boolean;
  onUseInScenario: () => void;
}

export function PresetDetail({ s, canStartScenario, onUseInScenario }: PresetDetailProps) {
  const p = s.selected;
  const ro = !s.editable;
  const d = s.draft;
  const e = s.errors;
  const set = (k: keyof PresetDraft) => (ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  s.setDraft({ ...d, [k]: ev.target.value });

  const isBuiltIn = !!p?.builtIn;
  const lockedBuiltIn = isBuiltIn && !s.canEditBuiltIns;
  const title = s.isNew ? d.name.trim() || 'New preset' : p?.name ?? '';

  const numberField = (k: keyof PresetDraft, label: string, unit: string | undefined, help: string, hint?: React.ReactNode, display?: React.ReactNode) =>
  <PresetField label={label} unit={unit} help={help} error={e[k]} hint={hint} readOnly={ro} display={display ?? d[k]}>
      {(id, describedBy) =>
    <input
      id={id}
      inputMode="decimal"
      value={d[k]}
      onChange={set(k)}
      aria-invalid={!!e[k]}
      aria-describedby={describedBy}
      className={inputCls(e[k])} />

    }
    </PresetField>;


  const pct = (k: 'mortality' | 'asymptomatic') => {
    const v = asPercent(d[k]);
    return v ? `= ${v}` : undefined;
  };

  return (
    <section className="bg-surface rounded-xl border border-border" aria-labelledby="preset-title">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {isBuiltIn && <Lock size={16} className="text-text-secondary" aria-hidden />}
              <h2 id="preset-title" className="text-h2 text-text-primary truncate">
                {title}
              </h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                isBuiltIn ? 'bg-surface-2 text-text-secondary' : 'bg-hover text-primary'}`
                }>
                
                {isBuiltIn ? 'Built-in' : 'Custom'}
              </span>
              {p?.placeholder &&
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Placeholder values</span>
              }
              {s.dirty &&
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
                  <span className="w-2 h-2 rounded-full bg-warning" /> Unsaved changes
                </span>
              }
            </div>
            <p className="text-[13px] text-text-secondary mt-1.5">
              {s.isNew ? 'A new custom preset. Fill in the values below, then save.' : p?.description}
              {p && <span> · Updated {p.updated}</span>}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {canStartScenario && p && !s.dirty &&
            <button
              onClick={onUseInScenario}
              className="px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap">
              
                <PlayCircle size={15} /> Use in a new scenario
              </button>
            }
            {s.canCreate && p && (lockedBuiltIn || !s.dirty) &&
            <button
              onClick={() => s.clone(p)}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              lockedBuiltIn ?
              'bg-primary hover:bg-primary-dark text-white' :
              'border border-border text-text-primary hover:border-primary/40'}`
              }>
              
                <Copy size={15} /> Clone as custom
              </button>
            }
            {s.editable && s.dirty &&
            <>
                <button
                onClick={s.discard}
                disabled={s.saving}
                className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50">
                
                  Discard
                </button>
                <button
                onClick={s.save}
                disabled={s.saving}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-70 disabled:cursor-wait">
                
                  {s.saving && <Loader2 size={14} className="animate-spin" />}
                  {s.saving ? 'Saving…' : s.isNew ? 'Create preset' : 'Save changes'}
                </button>
              </>
            }
          </div>
        </div>

        {lockedBuiltIn &&
        <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
            <ShieldCheck size={15} className="text-primary mt-0.5 flex-shrink-0" />
            Built-in presets are validated reference values and can’t be edited.
            {s.canCreate && ' Clone it to make an editable copy.'}
          </p>
        }
        {isBuiltIn && s.canEditBuiltIns && s.canCreate &&
        <p className="mt-4 flex items-start gap-2 text-[13px] text-warning">
            <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
            You have permission to edit built-in presets. Changes apply to every new scenario that uses this preset.
          </p>
        }
        {!s.canCreate &&
        <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
            <Eye size={15} className="mt-0.5 flex-shrink-0" />
            You can view presets. Only Epidemiologists and Administrators can create or edit them.
          </p>
        }
      </div>

      {/* Form */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6">
        <PresetField
          label="Name"
          help="A short name others will recognise when they pick a preset for a scenario."
          error={e.name}
          readOnly={ro}
          display={d.name}
          wide>
          
          {(id, describedBy) =>
          <input
            id={id}
            value={d.name}
            onChange={set('name')}
            placeholder="e.g. Ebola (baseline)"
            aria-invalid={!!e.name}
            aria-describedby={describedBy}
            className={inputCls(e.name).replace(' tabular-nums', '')} />

          }
        </PresetField>

        {numberField('r0', 'R0, basic reproduction number', undefined, 'The average number of people one infected person passes the disease to, when nobody is immune and no measures are in place.', 'Usually between 1 and 5 for these diseases.')}

        <PresetField
          label="Transmission route"
          help="The main way the disease spreads from person to person."
          readOnly={ro}
          display={ROUTE_LABELS[d.route]}
          hint={ROUTE_HELP[d.route]}>
          
          {(id, describedBy) =>
          <select id={id} value={d.route} onChange={set('route')} aria-describedby={describedBy} className={inputCls()}>
              {(Object.keys(ROUTE_LABELS) as TransmissionRoute[]).map((r) =>
            <option key={r} value={r}>
                  {ROUTE_LABELS[r]}
                </option>
            )}
            </select>
          }
        </PresetField>

        {numberField('incubationDays', 'Incubation period', 'days', 'Days between catching the disease and the first symptoms.', 'Decimals allowed, e.g. 8.5')}
        {numberField('infectiousDays', 'Infectious period', 'days', 'Days a sick person can pass the disease on to others.', 'Decimals allowed, e.g. 10')}

        {numberField(
          'mortality',
          'Mortality rate',
          '0 to 1',
          'The share of people with the disease who die from it. 0.5 means half of them.',
          pct('mortality') ?? 'Enter as a decimal: 0.5 = 50%',
          `${d.mortality} (${asPercent(d.mortality)})`
        )}
        {numberField(
          'asymptomatic',
          'Asymptomatic fraction',
          '0 to 1',
          'The share of infected people who never feel sick. They can still matter for spread.',
          pct('asymptomatic') ?? 'Enter as a decimal: 0.1 = 10%',
          `${d.asymptomatic} (${asPercent(d.asymptomatic)})`
        )}

        <PresetField
          label="Source / citation"
          help="The study or report these values come from, so anyone can check the evidence."
          readOnly={ro}
          display={<span className="whitespace-pre-wrap text-[13px]">{d.source || 'No source given'}</span>}
          hint={
          d.source.trim() ?
          'Cite where these values come from, especially if borrowed from another outbreak.' :
          <span className="text-warning">No source yet. Cite where these values come from, especially if borrowed from another outbreak.</span>
          }
          wide>
          
          {(id, describedBy) =>
          <textarea
            id={id}
            rows={4}
            value={d.source}
            onChange={set('source')}
            aria-describedby={describedBy}
            placeholder="e.g. WHO Ebola Response Team (2014). Ebola virus disease in West Africa. NEJM 371:1481–95."
            className={`${inputCls()} resize-y text-[13px]`} />

          }
        </PresetField>
      </div>

      {p?.placeholder &&
      <p className="px-6 pb-6 -mt-1 text-[12px] text-text-secondary">
          These values are illustrative placeholders for design review. Replace them with sourced values before using results for decisions.
        </p>
      }
    </section>);

}