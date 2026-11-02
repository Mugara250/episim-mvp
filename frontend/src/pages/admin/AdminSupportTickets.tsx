import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Clock,
  CheckCircle2,
  Download } from
'lucide-react';
export function AdminSupportTickets() {
  const [activeTab, setActiveTab] = useState('Open');
  const tickets = [
  {
    id: 'TKT-1042',
    subject: 'Cannot export scenario comparison to PDF',
    user: 'Dr. Sarah Chen',
    role: 'Epidemiologist',
    priority: 'High',
    status: 'Open',
    date: '2 hours ago',
    assigned: 'Unassigned'
  },
  {
    id: 'TKT-1041',
    subject: 'Requesting updated Marburg incubation period values',
    user: 'James Wilson',
    role: 'Policy Maker',
    priority: 'Medium',
    status: 'In Progress',
    date: '1 day ago',
    assigned: 'Admin'
  },
  {
    id: 'TKT-1039',
    subject: 'Login MFA not sending SMS',
    user: 'Alice Mutoni',
    role: 'Health Officer',
    priority: 'Critical',
    status: 'Open',
    date: '1 day ago',
    assigned: 'Unassigned'
  }];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-text-primary">
          Support Tickets
        </h1>
        <button className="bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium flex items-center transition-colors">
          <Download size={16} className="mr-2" /> Export Tickets
        </button>
      </div>

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
            <p className="text-xl font-bold text-text-primary">12</p>
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
            <p className="text-xl font-bold text-text-primary">4.2 hrs</p>
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
            <p className="text-xl font-bold text-accent">1</p>
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
                <th className="px-6 py-3 font-medium">Date</th>
                <th className="px-6 py-3 font-medium">Assigned To</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {tickets.
              filter(
                (t) =>
                activeTab === 'All' ||
                t.status === activeTab ||
                activeTab === 'Open' && t.status === 'Open'
              ).
              map((t, i) =>
              <tr key={i} className="hover:bg-background">
                    <td className="px-6 py-4 font-mono text-[12px] text-text-secondary">
                      {t.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-text-primary mb-0.5">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {t.user} <span className="mx-1">•</span> {t.role}
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
                    <td className="px-6 py-4 text-text-secondary">{t.date}</td>
                    <td className="px-6 py-4 text-text-secondary">
                      {t.assigned}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:text-primary-dark font-medium text-[12px]">
                        View
                      </button>
                    </td>
                  </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}