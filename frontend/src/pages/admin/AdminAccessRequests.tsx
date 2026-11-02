import { useEffect, useState } from 'react';
import { Inbox } from 'lucide-react';
import { AccessRequestCard } from '../../components/admin/AccessRequestCard';
import { PresetToasts } from '../../components/presets/PresetToasts';
import { useToasts } from '../../hooks/useToasts';
import { useAccountRequests } from '../../context/AccountRequestContext';
import { ROLE_LABELS } from '../../lib/rbac';
import { AccountRequestStatus } from '../../types/accountRequests';
import { QueryState } from '../../components/officer/DataState';

type Tab = AccountRequestStatus | 'All';
const TABS: Tab[] = ['Pending', 'Approved', 'Rejected', 'All'];

export function AdminAccessRequests() {
  const { requests, approveRequest, rejectRequest, markAllSeen, isLoading, error } = useAccountRequests();
  const [activeTab, setActiveTab] = useState<Tab>('Pending');
  const toasts = useToasts();

  // Opening this page clears the "new request" notifications, after the NEW tags have been seen once.
  useEffect(() => {
    const t = setTimeout(markAllSeen, 4000);
    return () => clearTimeout(t);
  }, [requests.length]);

  const visible = activeTab === 'All' ? requests : requests.filter((r) => r.status === activeTab);
  const count = (tab: Tab) => tab === 'All' ? requests.length : requests.filter((r) => r.status === tab).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <PresetToasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Account Requests</h1>
        <p className="text-[13px] text-text-secondary mt-1">
          People asking for an EpiSim account. Verify their institution account ID before approving — approved requesters are notified that they can sign in.
        </p>
      </div>

      <div className="flex space-x-1 border-b border-border" role="tablist">
        {TABS.map((tab) =>
        <button
          key={tab}
          role="tab"
          aria-selected={activeTab === tab}
          onClick={() => setActiveTab(tab)}
          className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
          
            {tab}
            <span className={`ml-1.5 py-0.5 px-2 rounded-full text-[10px] ${activeTab === tab ? 'bg-primary/10 text-primary' : 'bg-surface-2 text-text-secondary'}`}>
              {count(tab)}
            </span>
          </button>
        )}
      </div>

      <QueryState isLoading={isLoading} error={error}>
      {visible.length === 0 ?
      <div className="bg-surface rounded-xl border border-border p-12 text-center">
          <Inbox size={32} className="mx-auto text-text-secondary mb-3" />
          <h2 className="text-[15px] font-medium text-text-primary">No {activeTab === 'All' ? '' : activeTab.toLowerCase()} requests</h2>
          <p className="text-[13px] text-text-secondary mt-1">
            {activeTab === 'Pending' ? 'You’re all caught up. New requests will show up here and in your notifications.' : 'Nothing to show in this list yet.'}
          </p>
        </div> :

      <div className="space-y-4">
          {visible.map((req) =>
        <AccessRequestCard
          key={req.id}
          request={req}
          onApprove={async (role, hospitalId) => {
            try {
              await approveRequest(req.id, role, hospitalId);
              // No email is sent in the demo; the requester sees the new status on the sign-in page.
              toasts.push('success', `${req.name} approved as ${ROLE_LABELS[role]}. Account created; they can now sign in with the password they chose.`);
            } catch (e) {
              toasts.push('error', e instanceof Error ? e.message : 'The request could not be approved.');
            }
          }}
          onReject={async (reason) => {
            try {
              await rejectRequest(req.id, reason);
              toasts.push('info', `Request from ${req.name} rejected. They’ll see your reason when they check their status.`);
            } catch (e) {
              toasts.push('error', e instanceof Error ? e.message : 'The request could not be rejected.');
            }
          }} />

        )}
        </div>
      }
      </QueryState>
    </div>);

}