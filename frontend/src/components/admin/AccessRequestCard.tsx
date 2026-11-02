import React, { useState } from 'react';
import { Check, X, Building2, Hash, Briefcase, Mail } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROLE_LABELS, Role } from '../../lib/rbac';
import { AccountRequest } from '../../types/accountRequests';
import { formatDateTime, timeAgo } from '../../utils/accountRequests';

interface AccessRequestCardProps {
  request: AccountRequest;
  onApprove: (role: Role, hospitalId?: string) => void;
  onReject: (reason: string) => void;
}

const ASSIGNABLE_ROLES: Role[] = ['analyst', 'officer', 'policymaker'];

function suggestRole(position: string): Role {
  const p = position.toLowerCase();
  if (/minister|director|policy|permanent secretary/.test(p)) return 'policymaker';
  if (/officer|nurse|physician|clinician|hospital/.test(p)) return 'officer';
  return 'analyst';
}

const STATUS_STYLES = {
  Pending: 'bg-warning/10 text-warning border-warning/30',
  Approved: 'bg-success/10 text-success border-success/30',
  Rejected: 'bg-danger/10 text-danger border-danger/30'
};

export function AccessRequestCard({ request, onApprove, onReject }: AccessRequestCardProps) {
  const { hospitals } = useAdmin();
  const [mode, setMode] = useState<'idle' | 'approve' | 'reject'>('idle');
  const [role, setRole] = useState<Role>(suggestRole(request.position));
  const [hospitalId, setHospitalId] = useState('');
  const [reason, setReason] = useState('');

  const needsHospital = role === 'officer';
  const canApprove = !needsHospital || !!hospitalId;

  const details = [
  { icon: Building2, label: 'Institution', value: request.institution },
  { icon: Hash, label: 'Institution account ID', value: request.institutionAccountId },
  { icon: Briefcase, label: 'Role / position', value: request.position }];


  return (
    <article className="bg-surface rounded-xl border border-border shadow-card p-5">
      <div className="flex flex-col md:flex-row md:items-start gap-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[15px] font-semibold text-text-primary">{request.name}</h3>
                {!request.seenByAdmin && request.status === 'Pending' &&
                <span className="text-[10px] font-semibold bg-primary text-white px-1.5 py-0.5 rounded">NEW</span>
                }
              </div>
              <p className="text-[12px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                <Mail size={12} />
                {request.email}
              </p>
            </div>
            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border whitespace-nowrap ${STATUS_STYLES[request.status]}`}>
              {request.status}
            </span>
          </div>

          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {details.map((d) =>
            <div key={d.label}>
                <dt className="text-[11px] text-text-secondary flex items-center gap-1.5 mb-1">
                  <d.icon size={12} />
                  {d.label}
                </dt>
                <dd className="text-[13px] font-medium text-text-primary">{d.value}</dd>
              </div>
            )}
          </dl>

          {request.status === 'Approved' && request.assignedRole &&
          <p className="mt-4 text-[12px] text-text-secondary">
              Approved as <span className="font-semibold text-text-primary">{ROLE_LABELS[request.assignedRole]}</span> by {request.decidedBy}
              {request.decidedAt && ` · ${formatDateTime(request.decidedAt)}`}. The requester has been notified they can sign in.
            </p>
          }
          {request.status === 'Rejected' &&
          <p className="mt-4 text-[12px] text-text-secondary">
              Declined by {request.decidedBy}
              {request.decidedAt && ` · ${formatDateTime(request.decidedAt)}`}: “{request.rejectionReason}”
            </p>
          }
        </div>

        {request.status === 'Pending' && mode === 'idle' &&
        <div className="md:w-44 flex md:flex-col gap-2 md:border-l md:border-border md:pl-5">
            <p className="hidden md:block text-[11px] text-text-secondary mb-1">Submitted {timeAgo(request.submittedAt)}</p>
            <button
            onClick={() => setMode('approve')}
            className="flex-1 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium flex items-center justify-center transition-colors">
            
              <Check size={15} className="mr-1.5" /> Approve
            </button>
            <button
            onClick={() => setMode('reject')}
            className="flex-1 bg-surface border border-border hover:bg-background text-text-primary px-4 py-2 rounded-lg text-[13px] font-medium flex items-center justify-center transition-colors">
            
              <X size={15} className="mr-1.5" /> Reject
            </button>
          </div>
        }
      </div>

      {mode === 'approve' &&
      <div className="mt-5 pt-5 border-t border-border">
          <p className="text-[13px] font-semibold text-text-primary mb-3">Create account and assign a system role</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={`role-${request.id}`} className="block text-[11px] text-text-secondary mb-1.5">System role</label>
              <select
              id={`role-${request.id}`}
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
              
                {ASSIGNABLE_ROLES.map((r) =>
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              )}
              </select>
            </div>
            {needsHospital &&
          <div>
                <label htmlFor={`hosp-${request.id}`} className="block text-[11px] text-text-secondary mb-1.5">Hospital</label>
                <select
              id={`hosp-${request.id}`}
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
              
                  <option value="">Select hospital</option>
                  {hospitals.map((h) =>
              <option key={h.id} value={h.id}>{h.name}</option>
              )}
                </select>
              </div>
          }
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setMode('idle')} className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
            disabled={!canApprove}
            onClick={() => onApprove(role, needsHospital ? hospitalId : undefined)}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            
              Approve and notify
            </button>
          </div>
        </div>
      }

      {mode === 'reject' &&
      <div className="mt-5 pt-5 border-t border-border">
          <label htmlFor={`reason-${request.id}`} className="block text-[13px] font-semibold text-text-primary mb-2">
            Reason shared with the requester
          </label>
          <textarea
          id={`reason-${request.id}`}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          placeholder="e.g. Account ID could not be verified with the institution."
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary resize-none" />
        
          <div className="flex justify-end gap-2 mt-3">
            <button onClick={() => setMode('idle')} className="px-4 py-2 text-[13px] font-medium text-text-secondary hover:text-text-primary transition-colors">
              Cancel
            </button>
            <button
            disabled={!reason.trim()}
            onClick={() => onReject(reason.trim())}
            className="bg-danger hover:opacity-90 text-white px-4 py-2 rounded-lg text-[13px] font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            
              Reject request
            </button>
          </div>
        </div>
      }
    </article>);

}