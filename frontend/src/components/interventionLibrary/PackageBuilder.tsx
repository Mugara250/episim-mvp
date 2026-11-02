import { CalendarRange, Eye, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { InterventionPackagesState } from '../../hooks/useInterventionPackages';
import { InterventionType } from '../../types/interventions';
import { effectOf, pct } from '../../utils/interventions';
import { MechanismBadge } from './MechanismBadge';
import { ITEM_COLORS, PackageTimeline } from './PackageTimeline';

const inputCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary focus:outline-none ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;


export function PackageBuilder({ s, types }: {s: InterventionPackagesState;types: InterventionType[];}) {
  const d = s.draft;
  const ro = !s.canEdit;
  const items = [...d.items].sort((a, b) => a.startDay - b.startDay);
  const colorOf = (id: string) => ITEM_COLORS[d.items.findIndex((i) => i.id === id) % ITEM_COLORS.length];

  return (
    <section className="bg-surface rounded-xl border border-border" aria-label="Package builder">
      <div className="p-6 border-b border-border">
        <div className="flex flex-col xl:flex-row xl:items-start gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            {ro ?
            <>
                <h2 className="text-h2 text-text-primary">{d.name}</h2>
                {d.description && <p className="text-[13px] text-text-secondary">{d.description}</p>}
              </> :

            <>
                <div>
                  <label htmlFor="pkg-name" className="block text-[13px] font-medium text-text-primary mb-1.5">Package name</label>
                  <input id="pkg-name" value={d.name} onChange={(e) => s.setDraft({ ...d, name: e.target.value })} aria-invalid={!!s.nameError} className={`${inputCls(s.nameError)} text-[16px] font-semibold`} />
                  {s.nameError && <p className="text-[12px] text-danger mt-1.5">{s.nameError}</p>}
                </div>
                <div>
                  <label htmlFor="pkg-desc" className="block text-[13px] font-medium text-text-primary mb-1.5">
                    Description <span className="text-text-secondary font-normal">(optional)</span>
                  </label>
                  <textarea id="pkg-desc" rows={2} value={d.description} onChange={(e) => s.setDraft({ ...d, description: e.target.value })} placeholder="What this package is for and when to use it" className={`${inputCls()} resize-y text-[13px]`} />
                </div>
              </>
            }
          </div>
          {s.canEdit && s.dirty &&
          <div className="flex items-center gap-2 xl:pt-7 flex-shrink-0">
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-warning mr-2">
                <span className="w-2 h-2 rounded-full bg-warning" /> Unsaved changes
              </span>
              <button onClick={s.discard} disabled={s.saving} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50">
                Discard
              </button>
              <button
              onClick={s.save}
              disabled={s.saving}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-70 disabled:cursor-wait">
              
                {s.saving && <Loader2 size={14} className="animate-spin" />}
                {s.saving ? 'Saving…' : s.isNew ? 'Create package' : 'Save package'}
              </button>
            </div>
          }
        </div>
        {ro &&
        <p className="mt-4 flex items-start gap-2 text-[13px] text-text-secondary">
            <Eye size={15} className="mt-0.5 flex-shrink-0" />
            View only. Epidemiologists and Administrators can build packages.
          </p>
        }
      </div>

      <div className="p-6 space-y-6">
        {items.length === 0 ?
        <div className="rounded-xl border-2 border-dashed border-border px-6 py-14 text-center">
            <span className="w-12 h-12 rounded-full bg-hover flex items-center justify-center mx-auto mb-4">
              <CalendarRange size={20} className="text-primary" />
            </span>
            <p className="text-[15px] font-semibold text-text-primary">No interventions in this package yet</p>
            <p className="text-[13px] text-text-secondary mt-1 max-w-sm mx-auto">
              {ro ? 'An Epidemiologist hasn’t added any interventions to this package.' : 'Add an intervention and choose when it starts and stops. It will appear on the timeline here.'}
            </p>
            {!ro &&
          <button onClick={() => s.openEditor(null)} className="mt-5 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 transition-colors">
                <Plus size={15} /> Add intervention
              </button>
          }
          </div> :

        <>
            <PackageTimeline items={d.items} types={types} />

            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-h3 text-text-primary">Interventions</h3>
                {!ro &&
              <button onClick={() => s.openEditor(null)} className="px-3 py-2 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 flex items-center gap-1.5 transition-colors">
                    <Plus size={15} /> Add intervention
                  </button>
              }
              </div>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-[13px]">
                  <thead className="bg-background text-left text-text-secondary">
                    <tr>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Mechanism</th>
                      <th className="px-4 py-3 font-medium text-right">Start</th>
                      <th className="px-4 py-3 font-medium text-right">End</th>
                      <th className="px-4 py-3 font-medium text-right">Coverage</th>
                      <th className="px-4 py-3 font-medium text-right">Effective reduction</th>
                      {!ro && <th className="px-4 py-3"><span className="sr-only">Actions</span></th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {items.map((item) => {
                    const type = types.find((t) => t.id === item.typeId);
                    const effect = effectOf(item, type);
                    return (
                      <tr key={item.id}>
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: colorOf(item.id) }} aria-hidden />
                              <span className="font-medium text-text-primary">{type?.name ?? 'Unknown type'}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">{type && <MechanismBadge mechanism={type.mechanism} />}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-text-primary">Day {item.startDay}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-text-primary">{item.endDay === null ? <span className="text-text-secondary">Ongoing</span> : `Day ${item.endDay}`}</td>
                          <td className="px-4 py-3 text-right tabular-nums text-text-primary">{pct(item.coverage)}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-semibold text-text-primary tabular-nums">{pct(item.coverage * effect)}</span>
                            <span className="block text-[11px] text-text-secondary">
                              × {pct(effect)} {item.customEffect != null ? 'custom' : 'default'}
                            </span>
                          </td>
                          {!ro &&
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                              <button onClick={() => s.openEditor(item.id)} className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors" aria-label={`Edit ${type?.name}`}>
                                <Pencil size={15} />
                              </button>
                              <button onClick={() => s.removeItem(item.id)} className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-surface-2 transition-colors" aria-label={`Remove ${type?.name}`}>
                                <Trash2 size={15} />
                              </button>
                            </td>
                        }
                        </tr>);

                  })}
                  </tbody>
                </table>
              </div>
              <p className="text-[12px] text-text-secondary mt-3">Effect sizes are illustrative placeholders unless the type cites a source.</p>
            </div>
          </>
        }
      </div>
    </section>);

}