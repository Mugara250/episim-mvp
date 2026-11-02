import { useState } from 'react';
import { Megaphone, Plus, Edit2, Trash2, Clock } from 'lucide-react';
import { ApiAnnouncement, useAnnouncements, useDeleteAnnouncement, useSaveAnnouncement } from '../../api/admin';
import { IllustrativeBadge, QueryState } from '../../components/officer/DataState';

// Audience is stored as "all" or a comma-separated list of roles.
const AUDIENCES = [
{ key: 'all', label: 'All Users' },
{ key: 'analyst', label: 'Epidemiologists' },
{ key: 'officer', label: 'Health Officers' },
{ key: 'policymaker', label: 'Policy Makers' }];

const LEVELS = [
{ key: 'info', label: 'Information (Blue)' },
{ key: 'warning', label: 'Warning (Amber)' },
{ key: 'critical', label: 'Critical (Red Banner)' }];


const inputCls =
'w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary';

function audienceLabel(a: string) {
  const keys = a.split(',').map((k) => k.trim());
  return keys.map((k) => AUDIENCES.find((x) => x.key === k)?.label ?? k).join(', ');
}

interface Draft {
  title: string;
  body: string;
  audience: string[];
  level: string;
}

const EMPTY: Draft = { title: '', body: '', audience: ['all'], level: 'info' };

export function AdminAnnouncements() {
  const listQ = useAnnouncements();
  const saveM = useSaveAnnouncement();
  const deleteM = useDeleteAnnouncement();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [tried, setTried] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const announcements = listQ.data ?? [];

  const open = (a?: ApiAnnouncement) => {
    setEditingId(a?.id ?? null);
    setDraft(a ? { title: a.title, body: a.body, audience: a.audience.split(','), level: a.level } : EMPTY);
    setTried(false);
    setError(null);
    setShowForm(true);
  };

  const toggleAudience = (key: string) =>
  setDraft((d) => {
    if (key === 'all') return { ...d, audience: ['all'] };
    const rest = d.audience.filter((k) => k !== 'all');
    const next = rest.includes(key) ? rest.filter((k) => k !== key) : [...rest, key];
    return { ...d, audience: next.length ? next : ['all'] };
  });

  const save = async (published: boolean) => {
    setTried(true);
    if (!draft.title.trim()) return;
    setError(null);
    try {
      await saveM.mutateAsync({
        id: editingId ?? undefined,
        input: { title: draft.title.trim(), body: draft.body.trim(), audience: draft.audience.join(','), level: draft.level, published }
      });
      setShowForm(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The announcement could not be saved.');
    }
  };

  const remove = async (a: ApiAnnouncement) => {
    if (!window.confirm(`Delete “${a.title}”?`)) return;
    setError(null);
    try {
      await deleteM.mutateAsync(a.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The announcement could not be deleted.');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          System Announcements
        </h1>
        {!showForm &&
        <button
          onClick={() => open()}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors">

            <Plus size={16} className="mr-2" /> Create Announcement
          </button>
        }
      </div>

      {error &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{error}</div>
      }

      {showForm ?
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-background">
            <h2 className="text-[15px] font-semibold text-text-primary">
              {editingId ? 'Edit Announcement' : 'Create New Announcement'}
            </h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label htmlFor="an-title" className="block text-[13px] font-medium text-text-secondary mb-1">
                Announcement Title
              </label>
              <input
              id="an-title"
              type="text"
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="e.g. Scheduled Maintenance"
              className={`${inputCls} ${tried && !draft.title.trim() ? 'border-accent' : ''}`} />
              {tried && !draft.title.trim() && <p className="text-[12px] text-accent mt-1">Enter a title.</p>}
            </div>
            <div>
              <label htmlFor="an-body" className="block text-[13px] font-medium text-text-secondary mb-1">
                Message Body
              </label>
              <textarea
              id="an-body"
              rows={4}
              value={draft.body}
              onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
              placeholder="Enter the announcement details..."
              className={`${inputCls} resize-none`}>
            </textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <fieldset>
                <legend className="block text-[13px] font-medium text-text-secondary mb-2">
                  Target Audience
                </legend>
                <div className="space-y-2">
                  {AUDIENCES.map((a) =>
                <label key={a.key} className="flex items-center text-[13px] text-text-secondary">
                      <input
                    type="checkbox"
                    checked={draft.audience.includes(a.key)}
                    onChange={() => toggleAudience(a.key)}
                    className="mr-2 rounded text-primary focus:ring-primary" />
                      {a.label}
                    </label>
                )}
                </div>
              </fieldset>
              <div>
                <label htmlFor="an-level" className="block text-[13px] font-medium text-text-secondary mb-2">
                  Priority Level
                </label>
                <select
                id="an-level"
                value={draft.level}
                onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">

                  {LEVELS.map((l) => <option key={l.key} value={l.key}>{l.label}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
            <button
            onClick={() => setShowForm(false)}
            className="px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface">

              Cancel
            </button>
            <button
            onClick={() => save(false)}
            disabled={saveM.isPending}
            className="px-4 py-2 bg-hover text-text-primary rounded-lg text-[13px] font-medium hover:bg-background border border-border disabled:opacity-60">

              Save as draft
            </button>
            <button
            onClick={() => save(true)}
            disabled={saveM.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary-dark disabled:opacity-60">

              Publish Announcement
            </button>
          </div>
        </div> :

      <QueryState isLoading={listQ.isLoading} error={listQ.error}>
          <div className="space-y-4">
            {announcements.length === 0 &&
          <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">No announcements yet.</p>
          }
            {announcements.map((ann) =>
          <div
            key={ann.id}
            className="bg-surface rounded-xl border border-border shadow-sm p-5 flex flex-col md:flex-row gap-4">

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <h3 className="text-[15px] font-semibold text-text-primary">
                      {ann.title}
                    </h3>
                    <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${ann.published ? 'bg-primary/10 text-primary' : 'bg-background text-text-secondary border border-border'}`}>

                      {ann.published ? 'Published' : 'Draft'}
                    </span>
                    {ann.level !== 'info' &&
                <span className={`text-[10px] font-bold uppercase tracking-wider ${ann.level === 'critical' ? 'text-danger' : 'text-warning'}`}>{ann.level}</span>
                }
                    {ann.illustrative && <IllustrativeBadge className="!px-2 !py-0.5 !text-[10px]" />}
                  </div>
                  <p className="text-[13px] text-text-secondary mb-3">
                    {ann.body}
                  </p>
                  <div className="flex flex-wrap gap-4 text-[11px] text-text-secondary">
                    <span className="flex items-center">
                      <Megaphone size={12} className="mr-1" /> Target:{' '}
                      {audienceLabel(ann.audience)}
                    </span>
                    <span className="flex items-center">
                      <Clock size={12} className="mr-1" /> Created:{' '}
                      {new Date(ann.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} by {ann.createdBy}
                    </span>
                  </div>
                </div>
                <div className="flex md:flex-col justify-end gap-2 border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-4">
                  <button
                onClick={() => open(ann)}
                className="p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded transition-colors"
                aria-label={`Edit ${ann.title}`}
                title="Edit">

                    <Edit2 size={16} />
                  </button>
                  <button
                onClick={() => remove(ann)}
                className="p-2 text-text-secondary hover:text-accent hover:bg-accent/5 rounded transition-colors"
                aria-label={`Delete ${ann.title}`}
                title="Delete">

                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
          )}
          </div>
        </QueryState>
      }
    </div>);

}
