import { AlertTriangle, BedDouble, Eye, FlaskConical, Loader2, Lock, Syringe, Users } from 'lucide-react';
import { CapacityState } from '../../hooks/useCapacityProfiles';
import { CapacityDraft } from '../../types/capacity';
import { fmt, parseWhole } from '../../utils/capacity';
import { CapacityField } from './CapacityField';
import { GapPreview } from './GapPreview';

const GROUPS: {
  title: string;
  icon: typeof BedDouble;
  fields: {key: keyof CapacityDraft;label: string;unit: string;helper: string;optional?: boolean;}[];
}[] = [
{
  title: 'Beds and equipment',
  icon: BedDouble,
  fields: [
  { key: 'hospitalBeds', label: 'Hospital beds', unit: 'beds', helper: 'Total staffed beds available for patients, not including ICU.' },
  { key: 'icuBeds', label: 'ICU beds', unit: 'beds', helper: 'Intensive care beds with staff and equipment ready to use.' },
  { key: 'ventilators', label: 'Ventilators', unit: 'machines', helper: 'Working ventilators that can be assigned to patients.' }]

},
{
  title: 'Workforce',
  icon: Users,
  fields: [{ key: 'healthWorkers', label: 'Healthcare workers', unit: 'people', helper: 'Doctors, nurses and clinical staff available for patient care.' }]
},
{
  title: 'Testing',
  icon: FlaskConical,
  fields: [{ key: 'testsPerDay', label: 'Daily testing capacity', unit: 'tests per day', helper: 'How many samples labs serving this area can process in one day.' }]
},
{
  title: 'Vaccines',
  icon: Syringe,
  fields: [{ key: 'vaccineDoses', label: 'Vaccine supply', unit: 'doses', helper: 'Doses in stock for the disease being planned for, e.g. Ervebo for Ebola (Zaire).', optional: true }]
}];


export function ProfileDetail({ s }: {s: CapacityState;}) {
  const d = s.draft;
  const ro = !s.canEdit;
  const e = s.errors;
  const set = (patch: Partial<CapacityDraft>) => s.setDraft({ ...d, ...patch });
  const inst = s.institutions.find((i) => i.id === d.institutionId);
  const ownInst = s.institutions.find((i) => i.id === s.ownInstitution);
  const inUse = s.comparisons.length > 0;

  const summary = [
  { label: 'Hospital beds', value: d.hospitalBeds },
  { label: 'ICU beds', value: d.icuBeds },
  { label: 'Ventilators', value: d.ventilators },
  { label: 'Healthcare workers', value: d.healthWorkers },
  { label: 'Tests per day', value: d.testsPerDay }];


  return (
    <div className="space-y-6 min-w-0">
      <section className="bg-surface rounded-xl border border-border" aria-label="Profile details">
        <div className="p-6 border-b border-border">
          <div className="flex flex-col xl:flex-row xl:items-start gap-4">
            <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cap-name" className="block text-[13px] font-medium text-text-primary mb-1.5">Profile name</label>
                {ro ?
                <h2 className="text-h2 text-text-primary">{d.name}</h2> :

                <>
                    <input
                    id="cap-name"
                    value={d.name}
                    onChange={(ev) => set({ name: ev.target.value })}
                    placeholder="e.g. Kigali Region - 2026"
                    aria-invalid={!!e.name}
                    className={`w-full px-3 py-2.5 rounded-lg border bg-background text-[16px] font-semibold text-text-primary focus:outline-none ${
                    e.name ? 'border-danger' : 'border-border focus:border-primary'}`
                    } />
                  
                    {e.name && <p className="text-[12px] text-danger mt-1.5">{e.name}</p>}
                  </>
                }
              </div>
              <div>
                <label htmlFor="cap-inst" className="block text-[13px] font-medium text-text-primary mb-1.5">Institution / region</label>
                {ro || s.institutionLocked ?
                <div className="px-3 py-2.5 rounded-lg border border-border bg-background text-[14px] text-text-primary flex items-center gap-2">
                    {s.institutionLocked && !ro && <Lock size={13} className="text-text-secondary flex-shrink-0" aria-hidden />}
                    <span className="truncate">{inst?.name ?? ownInst?.name ?? '—'}</span>
                    {inst && <span className="ml-auto text-[11px] text-text-secondary whitespace-nowrap">{inst.kind}</span>}
                  </div> :

                <select
                  id="cap-inst"
                  value={d.institutionId}
                  onChange={(ev) => set({ institutionId: ev.target.value })}
                  aria-invalid={!!e.institutionId}
                  className={`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none ${
                  e.institutionId ? 'border-danger' : 'border-border focus:border-primary'}`
                  }>
                  
                    <option value="">Choose an institution or region</option>
                    {s.institutions.map((i) =>
                  <option key={i.id} value={i.id}>
                        {i.name} · {i.kind}
                      </option>
                  )}
                  </select>
                }
                {!ro && s.institutionLocked &&
                <p className="text-[12px] text-text-secondary mt-1.5">You can only manage profiles for your own institution.</p>
                }
                {e.institutionId && <p className="text-[12px] text-danger mt-1.5">{e.institutionId}</p>}
              </div>
            </div>

            {!ro &&
            <div className="flex items-center gap-2 xl:pt-7 flex-shrink-0">
                {s.dirty &&
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-warning mr-1">
                    <span className="w-2 h-2 rounded-full bg-warning" /> Unsaved changes
                  </span>
              }
                <button
                onClick={s.discard}
                disabled={!s.dirty || s.saving}
                className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                
                  Discard
                </button>
                <button
                onClick={s.save}
                disabled={!s.dirty || s.saving}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                
                  {s.saving && <Loader2 size={14} className="animate-spin" />}
                  {s.saving ? 'Saving…' : s.isNew ? 'Create profile' : 'Save'}
                </button>
              </div>
            }
          </div>

          {ro &&
          <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
              <Eye size={15} className="mt-0.5 flex-shrink-0" />
              You have view-only access to capacity profiles.
              {s.ownInstitution && ' You can edit profiles for your own institution only.'}
            </p>
          }
          {!ro && inUse &&
          <p className="mt-4 flex items-start gap-2 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2.5 text-[13px] text-text-primary">
              <AlertTriangle size={15} className="text-warning mt-0.5 flex-shrink-0" />
              Changes apply to every saved comparison using this profile. Their capacity warnings will update automatically.
            </p>
          }
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 border-b border-border">
          {summary.map((m, i) => {
            const n = parseWhole(m.value);
            return (
              <div key={m.label} className={`px-6 py-5 ${i > 0 ? 'md:border-l border-border' : ''}`}>
                <p className="text-[12px] text-text-secondary">{m.label}</p>
                <p className="text-[26px] leading-tight font-bold text-text-primary tabular-nums mt-1">{Number.isNaN(n) ? '—' : fmt(n)}</p>
              </div>);

          })}
        </div>

        <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-5">
          {GROUPS.map((g) => {
            const Icon = g.icon;
            return (
              <fieldset key={g.title} className={`rounded-xl border border-border p-5 ${g.fields.length > 1 ? 'xl:col-span-2' : ''}`}>
                <legend className="px-1 -ml-1 flex items-center gap-2 text-[14px] font-semibold text-text-primary">
                  <Icon size={16} className="text-primary" aria-hidden /> {g.title}
                </legend>
                <div className={`grid grid-cols-1 gap-5 mt-1 ${g.fields.length > 1 ? 'md:grid-cols-3' : ''}`}>
                  {g.fields.map((f) =>
                  <CapacityField
                    key={f.key}
                    id={`cap-${f.key}`}
                    label={f.label}
                    unit={f.unit}
                    helper={f.helper}
                    optional={f.optional}
                    value={d[f.key]}
                    error={e[f.key]}
                    readOnly={ro}
                    onChange={(v) => set({ [f.key]: v })} />

                  )}
                </div>
              </fieldset>);

          })}

          <div className="xl:col-span-2">
            <label htmlFor="cap-source" className="block text-[13px] font-medium text-text-primary mb-1.5">
              Data source / as-of date <span className="text-text-secondary font-normal">· Optional</span>
            </label>
            <textarea
              id="cap-source"
              rows={2}
              value={d.sourceNote}
              disabled={ro}
              onChange={(ev) => set({ sourceNote: ev.target.value })}
              placeholder="e.g. District bed register, as of 30 Sep 2026"
              className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary resize-y disabled:opacity-70 disabled:cursor-not-allowed" />
            
            <p className="text-[12px] text-text-secondary mt-1.5">Where the numbers came from and when they were counted, so others can trust them.</p>
          </div>

          {s.selected?.placeholder &&
          <p className="xl:col-span-2 text-[12px] text-text-secondary">Illustrative: these numbers are placeholders for the demo, not official figures.</p>
          }
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        <section className="bg-surface rounded-xl border border-border" aria-labelledby="cap-scenarios">
          <div className="px-6 pt-6 pb-3 flex items-baseline justify-between">
            <h3 id="cap-scenarios" className="text-h3 text-text-primary">Comparisons using this profile</h3>
            <span className="text-[12px] text-text-secondary">{s.comparisons.length}</span>
          </div>
          {s.comparisons.length === 0 ?
          <p className="px-6 pb-6 text-[13px] text-text-secondary">
              {s.isNew ? 'Once saved, this profile can be chosen when results are reviewed or compared.' : 'No saved comparisons use this profile yet. Changes here won’t affect any saved results.'}
            </p> :

          <ul className="divide-y divide-border border-t border-border">
              {s.comparisons.map((c) =>
            <li key={c.id} className="px-6 py-3 flex items-center gap-3">
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-text-primary truncate">{c.name}</span>
                    <span className="block text-[12px] text-text-secondary">{c.id}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-surface-2 text-[11px] font-semibold text-text-secondary whitespace-nowrap">
                    {c.runs} runs
                  </span>
                  <span className="text-[12px] text-text-secondary tabular-nums whitespace-nowrap">{c.date}</span>
                </li>
            )}
            </ul>
          }
        </section>
        <GapPreview draft={d} />
      </div>
    </div>);

}