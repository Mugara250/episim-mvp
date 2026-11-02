import React, { useState } from 'react';
import { Download, RotateCcw } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { AuditAction } from '../../types/admin';
import { downloadCsv } from '../../utils/csv';

const selectCls =
'w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary';
const labelCls = 'block text-[12px] font-medium text-text-secondary mb-1';

const ACTIONS: AuditAction[] = [
'Parameter change',
'Parameter set approved',
'Simulation run',
'Report submitted',
'Report approved',
'Report published',
'User created',
'User updated',
'Account status changed',
'Hospital registered',
'Hospital updated',
'Sign in'];


const SCIENCE: AuditAction[] = ['Parameter change', 'Parameter set approved', 'Report approved', 'Report published'];

export function AdminAuditLogs() {
  const { audit } = useAdmin();
  const [user, setUser] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const people = Array.from(new Set(audit.map((a) => a.user))).sort();
  const rows = audit.filter((a) => {
    const day = a.time.slice(0, 10);
    return (!user || a.user === user) && (!action || a.action === action) && (!from || day >= from) && (!to || day <= to);
  });
  const filtered = !!(user || action || from || to);

  const exportCsv = () =>
  downloadCsv(
    `episim-audit-log${from ? `-${from}` : ''}${to ? `-to-${to}` : ''}.csv`,
    ['Time', 'User', 'Role', 'Action', 'Target', 'Details'],
    rows.map((a) => [a.time, a.user, a.role, a.action, a.target, a.details])
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Audit Logs</h1>
          <p className="text-[13px] text-text-secondary mt-1">Every parameter change, approval, published report and account change. Entries can’t be edited.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={rows.length === 0}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-auto">
          
          <Download size={16} className="mr-2" /> Export CSV ({rows.length})
        </button>
      </div>

      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_160px_auto] gap-3 items-end">
        <div>
          <label htmlFor="al-user" className={labelCls}>User</label>
          <select id="al-user" className={selectCls} value={user} onChange={(e) => setUser(e.target.value)}>
            <option value="">All users</option>
            {people.map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="al-action" className={labelCls}>Action</label>
          <select id="al-action" className={selectCls} value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All actions</option>
            {ACTIONS.map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="al-from" className={labelCls}>From</label>
          <input id="al-from" type="date" className={selectCls} value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div>
          <label htmlFor="al-to" className={labelCls}>To</label>
          <input id="al-to" type="date" className={selectCls} value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button
          onClick={() => {setUser('');setAction('');setFrom('');setTo('');}}
          disabled={!filtered}
          className="px-3 py-2 rounded-lg border border-border text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-background flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          
          <RotateCcw size={14} className="mr-1.5" /> Clear
        </button>
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-background text-text-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Time</th>
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Action</th>
                <th className="px-6 py-3 font-medium">Target</th>
                <th className="px-6 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 &&
              <tr><td colSpan={5} className="px-6 py-10 text-center text-text-secondary">No entries match these filters.</td></tr>
              }
              {rows.map((a) =>
              <tr key={a.id}>
                  <td className="px-6 py-3 text-text-secondary font-mono text-[12px] whitespace-nowrap">{a.time}</td>
                  <td className="px-6 py-3">
                    <div className="font-medium text-text-primary whitespace-nowrap">{a.user}</div>
                    <div className="text-[11px] text-text-secondary">{a.role}</div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium whitespace-nowrap ${SCIENCE.includes(a.action) ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-background text-text-secondary border border-border'}`}>
                      {a.action}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-text-primary">{a.target}</td>
                  <td className="px-6 py-3 text-text-secondary">{a.details}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3.5 border-t border-border bg-background text-[13px] text-text-secondary">
          Showing {rows.length} of {audit.length} entries
        </div>
      </div>
    </div>);

}