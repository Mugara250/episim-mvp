import { Building2, Info, Lock, Pencil } from 'lucide-react';
import { ScenarioRefs } from '../../api/scenarios';
import { ScenarioDraft, Visibility } from '../../types/scenarios';
import { findDataset, findPackage, findPreset, formatPop, pct } from '../../utils/scenarios';
import { MiniTimeline } from './MiniTimeline';

interface NameReviewStepProps {
  draft: ScenarioDraft;
  onChange: (patch: Partial<ScenarioDraft>) => void;
  errors: Partial<Record<'name' | 'datasetId' | 'presetId', string>>;
  readOnly: boolean;
  institution: string;
  refs: ScenarioRefs;
  pinnedVersion?: number | null;
  onEdit: (step: number) => void;
}

const inputCls =
'w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none disabled:opacity-80 disabled:cursor-not-allowed';

export function NameReviewStep({ draft, onChange, errors, readOnly, institution, refs, pinnedVersion, onEdit }: NameReviewStepProps) {
  const dataset = findDataset(refs.datasets, draft.datasetId);
  const preset = findPreset(refs.presets, draft.presetId);
  const pkg = findPackage(refs.packages, draft.packageId);
  const visibilityOptions: {id: Visibility;label: string;help: string;}[] = [
  { id: 'private', label: 'Private (only me)', help: 'You can share it with specific people later.' },
  { id: 'institution', label: 'Share with my institution', help: `Everyone at ${institution} can view and clone it.` }];


  const rows = [
  {
    step: 0,
    label: 'Population dataset',
    error: errors.datasetId,
    body: dataset ?
    <>
          <p className="text-[14px] font-semibold text-text-primary">
            {dataset.name} - v{pinnedVersion ?? dataset.version}
          </p>
          <p className="text-[12px] text-text-secondary">
            {dataset.coverage} · {formatPop(dataset.population)} people · {dataset.source}
          </p>
        </> :
    null
  },
  {
    step: 1,
    label: 'Disease',
    error: errors.presetId,
    body: preset ?
    <>
          <p className="text-[14px] font-semibold text-text-primary">
            {preset.name} <span className="text-[12px] font-normal text-text-secondary">· {preset.builtIn ? 'Built-in' : 'Custom'}{preset.provisional ? ' · Provisional' : ''}</span>
          </p>
          <p className="text-[12px] text-text-secondary tabular-nums">
            R0 {preset.r0Likely} · incubation {preset.incubationDays} d · hospitalised {pct(preset.shareHospitalised)} · fatality {pct(preset.cfrHospital)} admitted, {pct(preset.cfrCommunity)} not admitted
          </p>
        </> :
    null
  },
  {
    step: 2,
    label: 'Interventions',
    error: undefined,
    body: pkg ?
    <>
          <p className="text-[14px] font-semibold text-text-primary">{pkg.name}</p>
          <p className="text-[12px] text-text-secondary mb-3">
            {pkg.items.length} intervention{pkg.items.length === 1 ? '' : 's'}
          </p>
          <div className="max-w-sm">
            <MiniTimeline pkg={pkg} types={refs.types} />
          </div>
        </> :

    <p className="text-[14px] text-text-primary">No interventions · shows the outbreak with no response</p>

  }];


  return (
    <div>
      <h2 className="text-h2 text-text-primary">{readOnly ? 'Scenario details' : 'Name and review'}</h2>
      <p className="text-[13px] text-text-secondary mt-1">
        {readOnly ? 'This is what the simulation runs.' : 'Check your choices, then save. You can’t edit a scenario once it’s saved.'}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mt-6">
        <div>
          <label htmlFor="sc-name" className="block text-[13px] font-medium text-text-primary mb-1.5">
            Scenario name
          </label>
          <input
            id="sc-name"
            value={draft.name}
            disabled={readOnly}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Ebola Rubavu · contact tracing + isolation"
            aria-invalid={!!errors.name}
            className={`${inputCls} ${errors.name ? 'border-danger' : 'border-border focus:border-primary'}`} />
          
          {errors.name && <p className="text-[12px] text-danger mt-1.5">{errors.name}</p>}
        </div>
        <fieldset>
          <legend className="block text-[13px] font-medium text-text-primary mb-1.5">Visibility</legend>
          <div className="grid grid-cols-2 gap-2">
            {visibilityOptions.map((o) =>
            <label
              key={o.id}
              title={o.help}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-[13px] ${
              readOnly ? 'cursor-default' : 'cursor-pointer'} ${
              draft.visibility === o.id ? 'border-primary bg-hover text-text-primary font-semibold' : 'border-border text-text-secondary'}`}>
              
                <input
                type="radio"
                name="visibility"
                className="accent-primary"
                disabled={readOnly}
                checked={draft.visibility === o.id}
                onChange={() => onChange({ visibility: o.id })} />
              
                <span className="whitespace-nowrap">{o.label}</span>
              </label>
            )}
          </div>
          <p className="text-[12px] text-text-secondary mt-1.5">{visibilityOptions.find((o) => o.id === draft.visibility)?.help}</p>
        </fieldset>
        <div className="lg:col-span-2">
          <label htmlFor="sc-desc" className="block text-[13px] font-medium text-text-primary mb-1.5">
            Description <span className="text-text-secondary font-normal">· Optional</span>
          </label>
          <textarea
            id="sc-desc"
            rows={2}
            value={draft.description}
            disabled={readOnly}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="What question does this scenario answer?"
            className={`${inputCls} border-border focus:border-primary text-[13px] resize-y`} />
          
        </div>
      </div>

      <section aria-label="Review" className="mt-6 rounded-xl border border-border divide-y divide-border">
        {rows.map((r) =>
        <div key={r.label} className="px-5 py-4 flex items-start gap-4">
            <span className="w-40 flex-shrink-0 text-[12px] font-medium text-text-secondary pt-0.5">{r.label}</span>
            <div className="flex-1 min-w-0">{r.body ?? <p className="text-[13px] text-danger">{r.error ?? 'Not chosen yet'}</p>}</div>
            {!readOnly &&
          <button onClick={() => onEdit(r.step)} className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:underline flex-shrink-0">
                <Pencil size={12} /> Edit
              </button>
          }
          </div>
        )}
        <div className="px-5 py-4 flex items-start gap-4">
          <span className="w-40 flex-shrink-0 text-[12px] font-medium text-text-secondary pt-0.5">Model type</span>
          <div className="flex-1 flex items-center gap-2 text-[14px] text-text-primary">
            <Lock size={13} className="text-text-secondary" aria-hidden />
            Stochastic SEIHFR (community, hospital and funeral spread)
            <span className="relative group inline-flex">
              <button type="button" aria-label="About model types" className="text-text-secondary hover:text-primary">
                <Info size={14} />
              </button>
              <span
                role="tooltip"
                className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 w-64 rounded-lg bg-text-primary text-surface text-[12px] px-3 py-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-150 ease-out z-10">
                
                National or geographic (30 districts) is chosen when you run the scenario. Agent-based models are out of scope.
              </span>
            </span>
          </div>
        </div>
      </section>

      <p className="mt-4 flex items-start gap-2 rounded-lg bg-background border border-border px-3 py-2.5 text-[13px] text-text-primary">
        <Building2 size={15} className="text-primary mt-0.5 flex-shrink-0" />
        Healthcare capacity isn’t set here. You’ll choose a capacity profile when you review results or compare scenarios.
      </p>
    </div>);

}