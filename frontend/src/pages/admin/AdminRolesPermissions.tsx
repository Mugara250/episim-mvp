import React, { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROLES, ROLE_LABELS, Role } from '../../lib/rbac';

type Action = 'view' | 'create' | 'edit' | 'export';
const ACTIONS: Action[] = ['view', 'create', 'edit', 'export'];

const ROLE_DESC: Record<Role, string> = {
  admin: 'People, hospitals and system settings. No science pages.',
  analyst: 'Epidemiologists, researchers and public health analysts. Owns parameters, simulations, reports and approvals.',
  officer: 'Enters daily data for one assigned hospital.',
  policymaker: 'Reads approved scenarios and reports.'
};

const MODULES = [
'User Management',
'Hospitals',
'Audit Logs',
'Disease Presets',
'Interventions',
'Simulations',
'Report approval',
'Reports',
'Hospital Tracker'] as
const;
type Module = (typeof MODULES)[number];

/** Science modules the Admin can never be given. */
const ADMIN_LOCKED: Module[] = ['Simulations', 'Report approval'];

const DEFAULTS: Record<Role, Partial<Record<Module, Action[]>>> = {
  admin: {
    'User Management': ACTIONS,
    Hospitals: ACTIONS,
    'Audit Logs': ['view', 'export'],
    'Disease Presets': ACTIONS,
    Interventions: ACTIONS
  },
  analyst: {
    'Disease Presets': ['view', 'create', 'edit'],
    Interventions: ['view', 'create', 'edit'],
    Simulations: ACTIONS,
    'Report approval': ['view', 'edit'],
    Reports: ACTIONS,
    'Hospital Tracker': ['view']
  },
  officer: {
    'Hospital Tracker': ['view', 'create', 'edit'],
    Reports: ['view', 'export'],
    'Disease Presets': ['view'],
    Interventions: ['view']
  },
  policymaker: { Reports: ['view', 'export'], 'Disease Presets': ['view'], Interventions: ['view'] }
};

export function AdminRolesPermissions() {
  const { users } = useAdmin();
  const [activeRole, setActiveRole] = useState<Role>('admin');
  const [matrix, setMatrix] = useState(DEFAULTS);
  const count = (r: Role) => users.filter((u) => u.role === r).length;

  const toggle = (mod: Module, action: Action) =>
  setMatrix((m) => {
    const current = m[activeRole][mod] ?? [];
    const next = current.includes(action) ? current.filter((a) => a !== action) : [...current, action];
    return { ...m, [activeRole]: { ...m[activeRole], [mod]: next } };
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-text-primary">Roles & Permissions</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-3">
          {ROLES.map((r) =>
          <button
            key={r}
            onClick={() => setActiveRole(r)}
            aria-pressed={activeRole === r}
            className={`w-full text-left p-4 rounded-xl border transition-colors ${activeRole === r ? 'bg-primary/5 border-primary/20 shadow-sm' : 'bg-surface border-border hover:border-primary/30'}`}>
            
              <div className="flex justify-between items-start gap-2 mb-1">
                <h3 className={`font-semibold text-[14px] ${activeRole === r ? 'text-primary' : 'text-text-primary'}`}>{ROLE_LABELS[r]}</h3>
                <span className="text-[11px] font-medium bg-background text-text-secondary px-2 py-0.5 rounded-full border border-border whitespace-nowrap">
                  {count(r)} users
                </span>
              </div>
              <p className="text-[12px] leading-snug text-text-secondary">{ROLE_DESC[r]}</p>
            </button>
          )}
        </div>

        <div className="md:col-span-3 bg-surface rounded-xl border border-border shadow-sm flex flex-col">
          <div className="p-5 border-b border-border flex items-center">
            <Shield className="text-primary mr-3" size={20} />
            <div>
              <h2 className="text-[16px] font-semibold text-text-primary">{ROLE_LABELS[activeRole]} permissions</h2>
              <p className="text-[12px] text-text-secondary">What this role can do in each area.</p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-background text-text-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Area</th>
                  {ACTIONS.map((a) => <th key={a} className="px-4 py-3 font-medium text-center capitalize">{a}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {MODULES.map((mod) => {
                  const locked = activeRole === 'admin' && ADMIN_LOCKED.includes(mod);
                  const granted = matrix[activeRole][mod] ?? [];
                  return (
                    <tr key={mod}>
                      <td className="px-6 py-3 font-medium text-text-primary">
                        <span className="flex items-center gap-2">
                          {mod}
                          {locked &&
                          <span className="inline-flex items-center gap-1 text-[11px] font-normal text-text-secondary">
                              <Lock size={11} /> Not allowed for Admin
                            </span>
                          }
                        </span>
                      </td>
                      {ACTIONS.map((action) =>
                      <td key={action} className="px-4 py-3 text-center">
                          <input
                          type="checkbox"
                          aria-label={`${ROLE_LABELS[activeRole]} ${action} ${mod}`}
                          checked={!locked && granted.includes(action)}
                          disabled={locked}
                          onChange={() => toggle(mod, action)}
                          className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40" />
                        
                        </td>
                      )}
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}