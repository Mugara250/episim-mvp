import { useState } from 'react';
import { Shield, Lock } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AccessLevel, ModuleId, PERMISSION_MATRIX, ROLES, ROLE_LABELS, Role } from '../../lib/rbac';

const ROLE_DESC: Record<Role, string> = {
  admin: 'People, hospitals and system settings. No science pages.',
  analyst: 'Epidemiologists, researchers and public health analysts. Owns parameters, simulations, reports and approvals.',
  officer: 'Enters daily data for one assigned hospital.',
  policymaker: 'Reads approved scenarios and reports.'
};

const MODULE_LABELS: Record<ModuleId, string> = {
  auth: 'Own account',
  dashboard: 'Dashboard',
  population: 'Population data',
  disease: 'Disease parameters',
  presets: 'Disease presets & intervention library',
  simulation: 'Simulations',
  branching: 'Branching (early outbreak)',
  hcw: 'Health-worker layer',
  rt: 'Rt tracking',
  interventions: 'Interventions / local plans',
  geographic: 'Geographic spread',
  healthcare: 'Hospital tracker',
  capacity: 'Capacity profiles',
  visualization: 'Visualisation',
  scenarios: 'Scenario library',
  scenario: 'Scenario comparison',
  reports: 'Reports & approval',
  users: 'User & access management',
  dataquality: 'Data quality',
  instructions: 'Response instructions'
};

const LEVEL_HELP: Record<AccessLevel, string> = {
  full: 'Everything, including approval',
  write: 'Create and edit (own scope)',
  limited: 'Restricted actions',
  review: 'View shared items and clone',
  read: 'View only',
  self: 'Own account only',
  none: 'No access'
};

const LEVEL_TONE: Record<AccessLevel, string> = {
  full: 'bg-primary/10 text-primary border-primary/20',
  write: 'bg-primary/10 text-primary border-primary/20',
  limited: 'bg-hover text-text-primary border-border',
  review: 'bg-hover text-text-primary border-border',
  read: 'bg-hover text-text-primary border-border',
  self: 'bg-background text-text-secondary border-border',
  none: 'bg-background text-text-secondary border-border'
};

export function AdminRolesPermissions() {
  const { users } = useAdmin();
  const [activeRole, setActiveRole] = useState<Role>('admin');
  const count = (r: Role) => users.filter((u) => u.role === r).length;
  const levels = PERMISSION_MATRIX[activeRole];
  const modules = (Object.keys(MODULE_LABELS) as ModuleId[]).sort((x, y) => (levels[x] === 'none' ? 1 : 0) - (levels[y] === 'none' ? 1 : 0));

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
              <p className="text-[12px] text-text-secondary">
                What this role can do in each area. This is the permission matrix the server enforces (mirrored from
                <code className="mx-1 text-[11px]">src/lib/rbac.ts</code>; a backend test checks they match). Changing it is a code change in the MVP.
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-background text-text-secondary border-b border-border">
                <tr>
                  <th className="px-6 py-3 font-medium">Area</th>
                  <th className="px-4 py-3 font-medium">Access</th>
                  <th className="px-4 py-3 font-medium">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modules.map((mod) => {
                  const level = levels[mod] ?? 'none';
                  return (
                    <tr key={mod}>
                      <td className="px-6 py-3 font-medium text-text-primary">
                        <span className="flex items-center gap-2">
                          {MODULE_LABELS[mod]}
                          {level === 'none' && <Lock size={11} className="text-text-secondary" aria-label="No access" />}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium border capitalize ${LEVEL_TONE[level]}`}>{level}</span>
                      </td>
                      <td className="px-4 py-3 text-text-secondary">{LEVEL_HELP[level]}</td>
                    </tr>);

                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>);

}