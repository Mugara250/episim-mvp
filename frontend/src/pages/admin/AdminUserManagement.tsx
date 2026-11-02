import { useState } from 'react';
import { Search, Download, Plus, Edit2, Power } from 'lucide-react';
import { UserFormDrawer } from '../../components/admin/UserFormDrawer';
import { useAdmin } from '../../context/AdminContext';
import { ROLES, ROLE_LABELS } from '../../lib/rbac';
import { AdminUser } from '../../types/admin';
import { downloadCsv } from '../../utils/csv';
import { IllustrativeBadge, QueryState } from '../../components/officer/DataState';

const selectCls =
'px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary';

const STATUS_TONE: Record<AdminUser['status'], string> = {
  Active: 'bg-primary/10 text-primary',
  Pending: 'bg-hover text-text-secondary',
  Inactive: 'bg-background text-text-secondary border border-border'
};

export function AdminUserManagement() {
  const { users, hospitals, hospitalName, toggleStatus, isLoading, error } = useAdmin();
  const [actionError, setActionError] = useState<string | null>(null);
  const toggle = async (id: string) => {
    setActionError(null);
    try {
      await toggleStatus(id);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : 'The status could not be changed.');
    }
  };
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [hospitalFilter, setHospitalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editing, setEditing] = useState<AdminUser | 'new' | null>(null);

  const q = search.trim().toLowerCase();
  const rows = users.filter(
    (u) =>
    (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) && (
    !roleFilter || u.role === roleFilter) && (
    !hospitalFilter || u.hospitalId === hospitalFilter) && (
    !statusFilter || u.status === statusFilter)
  );

  const exportCsv = () =>
  downloadCsv(
    'episim-users.csv',
    ['Name', 'Email', 'Role', 'Hospital', 'Organisation', 'Status', 'Last login'],
    rows.map((u) => [u.name, u.email, ROLE_LABELS[u.role], u.hospitalId ? hospitalName(u.hospitalId) : '', u.organisation, u.status, u.lastLogin])
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">User Management</h1>
          <p className="text-[13px] text-text-secondary mt-1">Every Public Health Officer must be assigned to one hospital.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={exportCsv} className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors">
            <Download size={16} className="mr-2" /> Export CSV
          </button>
          <button onClick={() => setEditing('new')} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors">
            <Plus size={16} className="mr-2" /> Add user
          </button>
        </div>
      </div>

      {actionError &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{actionError}</div>
      }

      <QueryState isLoading={isLoading} error={error}>
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-wrap gap-3">
        <label className="flex-1 min-w-[220px] relative">
          <span className="sr-only">Search users</span>
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email"
            className="w-full pl-9 pr-4 py-2 border border-border bg-background rounded-lg text-[13px] text-text-primary focus:outline-none focus:border-primary" />
          
        </label>
        <select aria-label="Filter by role" className={selectCls} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="">All roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
        <select aria-label="Filter by hospital" className={selectCls} value={hospitalFilter} onChange={(e) => setHospitalFilter(e.target.value)}>
          <option value="">All hospitals</option>
          {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
        </select>
        <select aria-label="Filter by status" className={selectCls} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option>Active</option>
          <option>Pending</option>
          <option>Inactive</option>
        </select>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-background text-text-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3.5 font-medium">User</th>
                <th className="px-6 py-3.5 font-medium">Role</th>
                <th className="px-6 py-3.5 font-medium">Hospital</th>
                <th className="px-6 py-3.5 font-medium">Status</th>
                <th className="px-6 py-3.5 font-medium">Last login</th>
                <th className="px-6 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 &&
              <tr><td colSpan={6} className="px-6 py-10 text-center text-text-secondary">No users match these filters.</td></tr>
              }
              {rows.map((u) =>
              <tr key={u.id}>
                  <td className="px-6 py-3.5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-hover text-primary flex items-center justify-center font-bold text-[11px] mr-3 flex-shrink-0">
                        {u.name.replace(/^(Dr\.|Hon\.)\s*/, '').substring(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-text-primary flex items-center gap-2">
                          {u.name}
                          {u.isDemo && <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">Demo login</span>}
                          {u.illustrative && !u.isDemo && <IllustrativeBadge className="!px-2 !py-0.5 !text-[10px]" />}
                        </div>
                        <div className="text-[12px] text-text-secondary">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5">
                    <span className="inline-flex items-center px-2 py-1 rounded text-[11px] font-medium bg-background text-text-secondary border border-border whitespace-nowrap">
                      {ROLE_LABELS[u.role]}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary">
                    {u.role === 'officer' ? hospitalName(u.hospitalId) : <span aria-label="Not applicable">—</span>}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium ${STATUS_TONE[u.status]}`}>{u.status}</span>
                  </td>
                  <td className="px-6 py-3.5 text-text-secondary whitespace-nowrap">{u.lastLogin}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex justify-end gap-1">
                      <button
                      onClick={() => setEditing(u)}
                      className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                      aria-label={`Edit ${u.name}`}
                      title="Edit">
                      
                        <Edit2 size={15} />
                      </button>
                      <button
                      onClick={() => toggle(u.id)}
                      className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-background transition-colors"
                      aria-label={`${u.status === 'Active' ? 'Deactivate' : 'Activate'} ${u.name}`}
                      title={u.status === 'Active' ? 'Deactivate' : 'Activate'}>
                      
                        <Power size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 border-t border-border bg-background text-[13px] text-text-secondary">
          Showing {rows.length} of {users.length} users
        </div>
      </div>
      </QueryState>

      {editing && <UserFormDrawer user={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </div>);

}