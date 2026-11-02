import { useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  Download } from
'lucide-react';
import { TicketStatus, useSetTicketStatus, useTickets } from '../../api/admin';
import { IllustrativeBadge, QueryState } from '../../components/officer/DataState';
import { timeAgo } from '../../utils/accountRequests';
import { downloadCsv } from '../../utils/csv';

const STATUSES: TicketStatus[] = ['Open', 'In Progress', 'Resolved', 'Closed'];

export function AdminSupportTickets() {
  const [activeTab, setActiveTab] = useState('Open');
  const ticketsQ = useTickets();
  const statusM = useSetTicketStatus();
  const [error, setError] = useState<string | null>(null);
  const tickets = ticketsQ.data ?? [];
  const openCount = tickets.filter((t) => t.status === 'Open').length;
  const criticalOpen = tickets.filter((t) => t.priority === 'Critical' && (t.status === 'Open' || t.status === 'In Progress')).length;
  const resolved = tickets.filter((t) => t.status === 'Resolved' || t.status === 'Closed');
  const avgHours = resolved.length ?
  resolved.reduce((sum, t) => sum + (new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime()), 0) / resolved.length / 3.6e6 :
  null;

  const setStatus = async (id: string, status: TicketStatus) => {
    setError(null);
    try {
      await statusM.mutateAsync({ id, status });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The ticket could not be updated.');
    }
  };

  const exportCsv = () =>
  downloadCsv(
    'episim-support-tickets.csv',
    ['Ticket ID', 'Subject', 'Requester', 'Priority', 'Status', 'Created', 'Updated'],
    tickets.map((t) => [t.id, t.subject, t.requester, t.priority, t.status, t.createdAt, t.updatedAt])
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          Support Tickets
        </h1>
        <button onClick={exportCsv} disabled={tickets.length === 0} className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors disabled:opacity-50">
          <Download size={16} className="mr-2" /> Export Tickets
        </button>
      </div>

      {error &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{error}</div>
      }

      <QueryState isLoading={ticketsQ.isLoading} error={ticketsQ.error}>
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
            <LifeBuoy size={20} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-text-secondary uppercase">
              Open Tickets
            </p>
            <p className="text-xl font-bold text-text-primary">{openCount}</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex items-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center mr-3">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-text-secondary uppercase">
              Avg Resolution Time
            </p>
            <p className="text-xl font-bold text-text-primary">{avgHours == null ? '—' : `${avgHours.toFixed(1)} hrs`}</p>
          </div>
        </div>
        <div className="bg-surface p-4 rounded-xl border border-accent/20 shadow-sm flex items-center bg-accent/5">
          <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mr-3">
            <MessageSquare size={20} />
          </div>
          <div>
            <p className="text-[12px] font-medium text-accent uppercase">
              Critical Unresolved
            </p>
            <p className="text-xl font-bold text-accent">{criticalOpen}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-border">
        {['Open', 'In Progress', 'Resolved', 'All'].map((tab) =>
        <button
          key={tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary hover:border-border'}`}>
          
            {tab}{' '}
            {tab === 'Open' &&
          <span className="ml-1.5 bg-primary/10 text-primary py-0.5 px-2 rounded-full text-[10px]">
                12
              </span>
          }
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-background text-text-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium">Ticket ID</th>
                <th className="px-6 py-3 font-medium">Subject & User</th>
                <th className="px-6 py-3 font-medium">Priority</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium">Raised</th>
                <th className="px-6 py-3 font-medium">Last update</th>
                <th className="px-6 py-3 font-medium text-right">Set status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.filter((t) => activeTab === 'All' || t.status === activeTab).length === 0 &&
              <tr><td colSpan={7} className="px-6 py-10 text-center text-text-secondary">No tickets in this list.</td></tr>
              }
              {tickets.
              filter((t) => activeTab === 'All' || t.status === activeTab).
              map((t) =>
              <tr key={t.id} className="hover:bg-background">
                    <td className="px-6 py-4 font-mono text-[12px] text-text-secondary">
                      {t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary mb-0.5 flex items-center gap-2 flex-wrap">
                        {t.subject}
                        {t.illustrative && <IllustrativeBadge className="!px-2 !py-0.5 !text-[10px]" />}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {t.requester}{t.body && <><span className="mx-1">•</span>{t.body}</>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${t.priority === 'Critical' ? 'bg-accent/10 text-accent border border-accent/20' : t.priority === 'High' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-hover text-text-secondary border border-border'}`}>
                    
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-[11px] font-medium bg-background text-text-primary border border-border">
                        {t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{timeAgo(t.createdAt)}</td>
                    <td className="px-6 py-4 text-text-secondary whitespace-nowrap">{timeAgo(t.updatedAt)}</td>
                    <td className="px-6 py-4 text-right">
                      <select
                    aria-label={`Status for ${t.id}`}
                    value={t.status}
                    disabled={statusM.isPending}
                    onChange={(e) => setStatus(t.id, e.target.value as TicketStatus)}
                    className="px-2 py-1 rounded-lg border border-border bg-background text-[12px] text-text-primary focus:outline-none focus:border-primary">
                    
                        {STATUSES.map((st) => <option key={st}>{st}</option>)}
                      </select>
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </QueryState>
    </div>);

}