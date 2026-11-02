import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Building2, Search, User, X } from 'lucide-react';
import { useShareTargets } from '../../api/scenarios';
import { Scenario, SharePermission } from '../../types/scenarios';
import { PERMISSION_LABELS } from '../../utils/scenarios';

type ShareInput = {kind: 'user' | 'institution';targetId: string;permission: SharePermission;};

interface ShareDialogProps {
  scenario: Scenario;
  onClose: () => void;
  /** Sends the full share list to the API; `text` is the toast shown once it is saved. */
  onChange: (shares: ShareInput[], text?: string) => void;
}

const ROLE_NAMES: Record<string, string> = {
  analyst: 'Epidemiologist',
  officer: 'Public Health Officer',
  policymaker: 'Policy Maker',
  admin: 'Administrator'
};

const fieldCls = 'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary';

export function ShareDialog({ scenario, onClose, onChange }: ShareDialogProps) {
  const [kind, setKind] = useState<'user' | 'institution'>('user');
  const [query, setQuery] = useState('');
  const [person, setPerson] = useState<string | null>(null);
  const [institution, setInstitution] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');

  const targets = useShareTargets();
  const existing = scenario.shares;
  const asInput = (list: typeof existing): ShareInput[] =>
  list.map((sh) => ({ kind: sh.kind as ShareInput['kind'], targetId: sh.targetId, permission: sh.permission as SharePermission }));
  const users = targets.data?.users ?? [];
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.
    filter(
      (c) =>
      c.id !== scenario.ownerId &&
      !existing.some((s) => s.kind === 'user' && s.targetId === c.id) && (
      !q || c.name.toLowerCase().includes(q) || (c.institution ?? '').toLowerCase().includes(q))
    ).
    slice(0, 5);
  }, [query, existing, scenario.ownerId, users]);
  const personName = users.find((u) => u.id === person)?.name ?? null;
  const freeInstitutions = (targets.data?.institutions ?? []).filter((i) => !existing.some((s) => s.kind === 'institution' && s.targetId === i.id));
  const targetId = kind === 'user' ? person : institution;
  const targetName = kind === 'user' ? personName : freeInstitutions.find((i) => i.id === institution)?.name;

  const add = () => {
    if (!targetId) return;
    onChange([...asInput(existing), { kind, targetId, permission }], `Shared with ${targetName} · ${PERMISSION_LABELS[permission]}.`);
    setPerson(null);
    setQuery('');
    setInstitution('');
  };
  const revoke = (id: string) => onChange(asInput(existing.filter((s) => s.id !== id)), 'Access removed.');
  const updatePermission = (id: string, p: SharePermission) =>
  onChange(asInput(existing.map((s) => s.id === id ? { ...s, permission: p } : s)), 'Permission updated.');

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.15 }} onClick={onClose} />
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-title"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="relative bg-surface rounded-xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-start justify-between gap-4 p-5 border-b border-border">
          <div className="min-w-0">
            <h2 id="share-title" className="text-h3 text-text-primary">Share scenario</h2>
            <p className="text-[13px] text-text-secondary truncate">{scenario.name}</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-text-primary p-1">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div role="tablist" className="grid grid-cols-2 gap-1 p-1 rounded-lg bg-background border border-border">
            {(['user', 'institution'] as const).map((k) =>
            <button
              key={k}
              role="tab"
              aria-selected={kind === k}
              onClick={() => setKind(k)}
              className={`py-2 rounded-md text-[13px] font-semibold flex items-center justify-center gap-2 transition-colors ${
              kind === k ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`
              }>
              
                {k === 'user' ? <User size={14} /> : <Building2 size={14} />}
                {k === 'user' ? 'A colleague' : 'An institution'}
              </button>
            )}
          </div>

          {kind === 'user' ?
          <div>
              <label htmlFor="share-user" className="block text-[13px] font-medium text-text-primary mb-1.5">Find a colleague</label>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" aria-hidden />
                <input
                id="share-user"
                value={personName ?? query}
                onChange={(e) => {
                  setPerson(null);
                  setQuery(e.target.value);
                }}
                placeholder="Search by name or institution"
                className={`${fieldCls} pl-9`} />
              
              </div>
              {targets.isLoading && <p className="mt-2 text-[13px] text-text-secondary">Loading colleagues…</p>}
              {targets.error && <p className="mt-2 text-[13px] text-danger">Couldn’t load colleagues: {targets.error.message}</p>}
              {!person && !targets.isLoading &&
            <ul className="mt-2 rounded-lg border border-border divide-y divide-border">
                  {matches.length === 0 ?
              <li className="px-3 py-3 text-[13px] text-text-secondary">No matching colleagues.</li> :

              matches.map((c) =>
              <li key={c.id}>
                        <button onClick={() => setPerson(c.id)} className="w-full text-left px-3 py-2.5 hover:bg-hover transition-colors">
                          <span className="block text-[13px] font-medium text-text-primary">{c.name}</span>
                          <span className="block text-[12px] text-text-secondary">{ROLE_NAMES[c.role] ?? c.role}{c.institution ? ` · ${c.institution}` : ''}</span>
                        </button>
                      </li>
              )
              }
                </ul>
            }
            </div> :

          <div>
              <label htmlFor="share-inst" className="block text-[13px] font-medium text-text-primary mb-1.5">Institution</label>
              <select id="share-inst" value={institution} onChange={(e) => setInstitution(e.target.value)} className={fieldCls}>
                <option value="">Choose an institution</option>
                {freeInstitutions.map((i) =>
              <option key={i.id} value={i.id}>{i.name}</option>
              )}
              </select>
            </div>
          }

          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="share-perm" className="block text-[13px] font-medium text-text-primary mb-1.5">Permission</label>
              <select id="share-perm" value={permission} onChange={(e) => setPermission(e.target.value as SharePermission)} className={fieldCls}>
                <option value="view">Can view</option>
                <option value="clone">Can clone</option>
              </select>
            </div>
            <button
              onClick={add}
              disabled={!targetId}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
              
              Share
            </button>
          </div>
          <p className="text-[12px] text-text-secondary">“Can clone” lets them make their own editable copy. Nobody can change your original.</p>

          <div>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">Who has access</h3>
            {existing.length === 0 ?
            <p className="text-[13px] text-text-secondary">Only you. This scenario is private.</p> :

            <ul className="rounded-lg border border-border divide-y divide-border">
                {existing.map((sh) =>
              <li key={sh.id} className="px-3 py-2.5 flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
                      {sh.kind === 'user' ? <User size={13} className="text-text-secondary" /> : <Building2 size={13} className="text-text-secondary" />}
                    </span>
                    <span className="flex-1 min-w-0 text-[13px] text-text-primary truncate">{sh.target}</span>
                    <select
                  value={sh.permission}
                  onChange={(e) => updatePermission(sh.id, e.target.value as SharePermission)}
                  aria-label={`Permission for ${sh.target}`}
                  className="px-2 py-1.5 rounded-md border border-border bg-background text-[12px] text-text-primary focus:outline-none focus:border-primary">
                  
                      <option value="view">Can view</option>
                      <option value="clone">Can clone</option>
                    </select>
                    <button onClick={() => revoke(sh.id)} className="text-[12px] font-semibold text-danger hover:underline">Revoke</button>
                  </li>
              )}
              </ul>
            }
          </div>
        </div>

        <div className="flex justify-end p-4 border-t border-border">
          <button onClick={onClose} className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
            Done
          </button>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}