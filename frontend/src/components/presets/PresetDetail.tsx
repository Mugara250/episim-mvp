import React from 'react';
import { AlertTriangle, BadgeCheck, Copy, Eye, Lock, PlayCircle, ShieldCheck, Loader2 } from 'lucide-react';
import { DiseasePresetsState } from '../../hooks/useDiseasePresets';
import { PresetDraft, PresetNumberKey } from '../../types/presets';
import { PRESET_GROUPS, PresetFieldSpec, asPercent, dateLabel } from '../../utils/presets';
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

  if (s.loading) {
    return <section className="bg-surface rounded-xl border border-border p-8 text-[13px] text-text-secondary">Loading presets…</section>;
  }
  if (s.loadError) {
    return (
      <section role="alert" className="bg-danger/10 border border-danger/30 rounded-xl p-8 text-[13px] text-text-primary">
        Presets couldn’t be loaded. {s.loadError}
      </section>);

  }
  if (!p && !s.isNew) {
    return <section className="bg-surface rounded-xl border border-border p-8 text-[13px] text-text-secondary">Choose a preset from the library.</section>;
  }

  const isBuiltIn = !!p?.builtIn;
  const lockedBuiltIn = isBuiltIn && !s.canEditBuiltIns;
  const title = s.isNew ? d.name.trim() || 'New preset' : p?.name ?? '';

  const numberField = (f: PresetFieldSpec) => {
    const k: PresetNumberKey = f.key;
    const percent = f.kind === 'fraction' ? asPercent(d[k]) : null;
    const display = percent ? `${d[k]} (${percent})` : d[k];
    const hint = percent ? `= ${percent}` : f.kind === 'fraction' ? 'Enter as a decimal: 0.5 = 50%' : undefined;
    return (
      <PresetField key={k} label={f.label} unit={f.unit} help={f.help} error={e[k]} hint={hint} readOnly={ro} display={display}>
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
      </PresetField>);

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
              {d.provisional &&
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning"
                title="Not yet reviewed by an epidemiologist for use in EpiSim">

                  Provisional
                </span>
              }
              {p?.illustrative &&
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning" title="Seeded for the demo">
                  Illustrative
                </span>
              }
              {s.dirty &&
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-warning">
                  <span className="w-2 h-2 rounded-full bg-warning" /> Unsaved changes
                </span>
              }
            </div>
            <p className="text-[13px] text-text-secondary mt-1.5">
              {s.isNew ? 'A new custom preset. Fill in the values below, then save.' : p?.description || p?.virus}
              {p && <span> · Version {p.version} · Updated {dateLabel(p.updatedAt)}</span>}
            </p>
            {p &&
            <p className="text-[12px] mt-1.5 flex items-center gap-1.5 text-text-secondary">
                <BadgeCheck size={14} className={p.approvedBy ? 'text-success' : 'text-text-secondary'} />
                {p.approvedBy ?
              `Values in version ${p.version} approved by ${p.approvedBy} on ${dateLabel(p.approvedOn)}` :
              'These values have not been approved by an epidemiologist yet'}
              </p>
            }
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {canStartScenario && p && !s.dirty &&
            <button
              onClick={onUseInScenario}
              className="px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors whitespace-nowrap">

                <PlayCircle size={15} /> Use in a new scenario
              </button>
            }
            {s.canApprove && p && !s.dirty && !p.approvedBy &&
            <button
              onClick={() => s.approve(false)}
              disabled={s.approving}
              className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold flex items-center gap-2 text-text-primary hover:border-primary/40 whitespace-nowrap transition-colors disabled:opacity-50">

                <BadgeCheck size={15} /> Approve values
              </button>
            }
            {s.canApprove && p && !s.dirty && p.provisional &&
            <button
              onClick={() => s.approve(true)}
              disabled={s.approving}
              className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold flex items-center gap-2 text-text-primary hover:border-primary/40 whitespace-nowrap transition-colors disabled:opacity-50">

                Approve and clear “Provisional”
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
            Built-in presets are read-only so scenarios that use them stay stable.
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
            You can view presets. Only Epidemiologists can create, edit or approve them.
          </p>
        }
      </div>

      {/* Identity and evidence */}
      <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-6 border-b border-border">
        <PresetField
          label="Name"
          help="A short name others will recognise when they pick a preset for a scenario."
          error={e.name}
          readOnly={ro}
          display={d.name}>

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

        <PresetField
          label="Disease"
          help="The disease family. Scenarios and Rt tracking group presets by it. Set when the preset is created."
          error={e.disease}
          readOnly={ro || !s.isNew}
          display={[d.disease, d.virus].filter(Boolean).join(' · ') || '—'}>

          {(id, describedBy) =>
          <div className="grid grid-cols-2 gap-2">
              <input
              id={id}
              value={d.disease}
              onChange={set('disease')}
              placeholder="e.g. ebola"
              aria-invalid={!!e.disease}
              aria-describedby={describedBy}
              className={inputCls(e.disease).replace(' tabular-nums', '')} />

              <input
              aria-label="Virus"
              value={d.virus}
              onChange={set('virus')}
              placeholder="Virus, e.g. Zaire ebolavirus"
              className={inputCls().replace(' tabular-nums', '')} />

            </div>
          }
        </PresetField>

        <PresetField
          label="Reference"
          help="The studies or reports these values come from, so anyone can check the evidence."
          readOnly={ro}
          display={<span className="whitespace-pre-wrap text-[13px]">{d.reference || 'No reference given'}</span>}
          hint={
          d.reference.trim() ?
          'Cite where these values come from, especially if borrowed from another outbreak.' :
          <span className="text-warning">No reference yet. Cite where these values come from.</span>
          }
          wide>

          {(id, describedBy) =>
          <textarea
            id={id}
            rows={3}
            value={d.reference}
            onChange={set('reference')}
            aria-describedby={describedBy}
            placeholder="e.g. WHO Ebola Response Team (2014). Ebola virus disease in West Africa. NEJM 371:1481–95."
            className={`${inputCls()} resize-y text-[13px]`} />

          }
        </PresetField>

        <PresetField
          label="Provisional"
          help="Provisional means the values have not been reviewed by an epidemiologist for use in EpiSim. Results based on them are labelled."
          readOnly={ro}
          display={d.provisional ? 'Yes, values not yet reviewed' : 'No'}
          wide>

          {(id) =>
          <label htmlFor={id} className="flex items-center gap-2 text-[13px] text-text-primary">
              <input
              id={id}
              type="checkbox"
              checked={d.provisional}
              onChange={(ev) => s.setDraft({ ...d, provisional: ev.target.checked })}
              className="w-4 h-4 accent-primary" />

              Mark these values as provisional (unreviewed)
            </label>
          }
        </PresetField>
      </div>

      {/* SEIHFR parameters */}
      {PRESET_GROUPS.map((g) =>
      <div key={g.title} className="p-6 border-b border-border last:border-b-0">
          <h3 className="text-h3 text-text-primary">{g.title}</h3>
          <p className="text-[13px] text-text-secondary mt-1 mb-5">{g.intro}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6 gap-y-6">{g.fields.map(numberField)}</div>
          {g.title === 'Transmission' && e.r0Range && <p className="text-[12px] text-danger mt-3">{e.r0Range}</p>}
          {g.title === 'Transmission routes' && e.routeShares && <p className="text-[12px] text-danger mt-3">{e.routeShares}</p>}
        </div>
      )}

      {d.provisional &&
      <p className="px-6 pb-6 pt-4 text-[12px] text-text-secondary">
          Provisional values have not been reviewed by an epidemiologist. Results built on them are scenario estimates, not forecasts.
        </p>
      }
    </section>);

}
