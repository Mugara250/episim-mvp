import { useState } from 'react';
import { Plus, Pencil, CheckCircle2, Trash2 } from 'lucide-react';
import { useOfficer } from '../context/OfficerContext';
import { PlanEditor } from '../components/officer/PlanEditor';
import { IllustrativeBadge, QueryState } from '../components/officer/DataState';
import { ResponsePlan } from '../types/officer';
import { formatDay } from '../utils/hospital';

export function LocalResponsePlans() {
  const { hospital, plans, savePlan, deletePlan, isLoading, error } = useOfficer();
  const [editing, setEditing] = useState<ResponsePlan | 'new' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const save = async (p: Omit<ResponsePlan, 'id' | 'updated'>) => {
    if (!editing) return;
    const { illustrative: _ignored, ...plan } = p;
    setSaveError(null);
    try {
      await savePlan(plan, editing === 'new' ? undefined : editing.id);
      setNotice(`“${p.title}” ${editing === 'new' ? 'created' : 'updated'}.`);
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'The plan could not be saved.');
      setEditing(null);
    }
  };

  const remove = async (p: ResponsePlan) => {
    if (!window.confirm(`Delete “${p.title}”? This can’t be undone.`)) return;
    setSaveError(null);
    try {
      await deletePlan(p.id);
      setNotice(`“${p.title}” deleted.`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'The plan could not be deleted.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Interventions</h1>
          <p className="text-body text-text-secondary">Local response plans for {hospital?.name ?? 'your hospital'}: what your team will do, with targets and a review date.</p>
          {plans.some((p) => p.illustrative) &&
          <p className="mt-2 flex items-center gap-2 text-[12px] text-text-secondary">
              <IllustrativeBadge /> Seeded sample plans for the demo.
            </p>
          }
        </div>
        <button
          onClick={() => setEditing('new')}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors self-start md:self-auto">
          
          <Plus size={16} className="mr-2" /> New plan
        </button>
      </div>

      {notice &&
      <div role="status" className="flex items-center gap-2 text-[13px] text-success bg-success/10 border border-success/20 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /> <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[12px] text-text-secondary hover:text-text-primary">Dismiss</button>
        </div>
      }

      {saveError &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{saveError}</div>
      }

      <QueryState isLoading={isLoading} error={error}>
      {plans.length === 0 ?
      <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">No plans yet. Create your first local response plan.</p> :

      <ul className="space-y-4">
          {plans.map((p) =>
        <li key={p.id} className="bg-surface rounded-xl border border-border p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-[16px] font-semibold text-text-primary">{p.title}</h2>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${p.status === 'Active' ? 'bg-success/15 text-success' : 'bg-surface-2 text-text-secondary'}`}>
                      {p.status}
                    </span>
                  </div>
                  <p className="text-[12px] text-text-secondary mt-1">
                    {p.disease} · {formatDay(p.startDate)} → review by {formatDay(p.reviewDate)} · updated {formatDay(p.updated)}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                onClick={() => setEditing(p)}
                className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                
                    <Pencil size={13} className="mr-1.5" /> Edit
                  </button>
                  <button
                onClick={() => remove(p)}
                aria-label={`Delete ${p.title}`}
                className="bg-surface border border-border hover:border-danger/40 hover:text-danger text-text-secondary px-2.5 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
              <table className="w-full text-[13px] mt-4">
                <tbody className="divide-y divide-border border-t border-border">
                  {p.actions.map((a, i) =>
              <tr key={i}>
                      <td className="py-2.5 text-text-primary">{a.name}</td>
                      <td className="py-2.5 text-right font-semibold text-text-primary">{a.target}</td>
                    </tr>
              )}
                </tbody>
              </table>
              {p.notes && <p className="text-[12px] text-text-secondary mt-3">{p.notes}</p>}
            </li>
        )}
        </ul>
      }
      </QueryState>

      {editing && <PlanEditor plan={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>);

}