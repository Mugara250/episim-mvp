import React, { useState } from 'react';
import { CalendarClock, AlertCircle } from 'lucide-react';
import { useOfficer } from '../context/OfficerContext';
import { INSTRUCTION_STATUSES, InstructionStatusBadge } from '../components/officer/InstructionStatus';
import { ownHospital } from '../data/hospital';
import { InstructionStatus } from '../types/officer';
import { formatDay } from '../utils/hospital';

export function ResponseInstructions() {
  const { instructions, setInstructions } = useOfficer();
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [showError, setShowError] = useState(false);
  const sorted = [...instructions].sort((a, b) => a.deadline.localeCompare(b.deadline));

  const setStatus = (id: string, status: InstructionStatus, why?: string) =>
  setInstructions((list) => list.map((i) => i.id === id ? { ...i, status, reason: status === "Can't do" ? why : undefined } : i));

  const choose = (id: string, status: InstructionStatus) => {
    if (status === "Can't do") {
      const current = instructions.find((i) => i.id === id);
      setReasonFor(id);
      setReason(current?.reason ?? '');
      setShowError(false);
      return;
    }
    setReasonFor(null);
    setStatus(id, status);
  };

  const confirmReason = (id: string) => {
    if (!reason.trim()) {
      setShowError(true);
      return;
    }
    setStatus(id, "Can't do", reason.trim());
    setReasonFor(null);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Response Instructions</h1>
        <p className="text-body text-text-secondary">
          Actions the Epidemiologist team has asked {ownHospital.name} to take. Keep each status up to date so the response plan stays accurate.
        </p>
      </div>

      {sorted.length === 0 ?
      <p className="bg-surface rounded-xl border border-border p-10 text-center text-[13px] text-text-secondary">No instructions received yet.</p> :

      <ul className="space-y-4">
          {sorted.map((i) => {
          const overdue = i.deadline < ownHospital.today && i.status !== 'Done' && i.status !== "Can't do";
          const open = reasonFor === i.id;
          return (
            <li key={i.id} className="bg-surface rounded-xl border border-border p-5">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[15px] font-semibold text-text-primary">{i.action}</h2>
                      <InstructionStatusBadge status={i.status} />
                    </div>
                    <dl className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-[12px]">
                      <div className="flex gap-1.5"><dt className="text-text-secondary">Target</dt><dd className="font-semibold text-text-primary">{i.target}</dd></div>
                      <div className="flex gap-1.5 items-center">
                        <dt className="text-text-secondary"><CalendarClock size={12} className="inline mr-1" />Deadline</dt>
                        <dd className={`font-semibold ${overdue ? 'text-danger' : 'text-text-primary'}`}>{formatDay(i.deadline)}{overdue && ' · overdue'}</dd>
                      </div>
                      <div className="flex gap-1.5"><dt className="text-text-secondary">Disease</dt><dd className="text-text-primary">{i.disease}</dd></div>
                      <div className="flex gap-1.5"><dt className="text-text-secondary">From</dt><dd className="text-text-primary">{i.from} · {formatDay(i.received)}</dd></div>
                    </dl>
                    {i.status === "Can't do" && i.reason && !open &&
                  <p className="mt-3 text-[12px] text-text-secondary bg-background border border-border rounded-lg px-3 py-2">
                        <span className="font-semibold text-text-primary">Reason:</span> {i.reason}
                      </p>
                  }
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`Status for ${i.action}`}>
                  {INSTRUCTION_STATUSES.map((s) => {
                  const active = i.status === s || open && s === "Can't do";
                  return (
                    <button
                      key={s}
                      role="radio"
                      aria-checked={active}
                      onClick={() => choose(i.id, s)}
                      className={`px-3 py-1.5 rounded-lg border text-[12px] font-semibold transition-colors ${active ? s === "Can't do" ? 'border-danger bg-danger/10 text-danger' : 'border-primary bg-hover text-primary' : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'}`}>
                      
                        {s}
                      </button>);

                })}
                </div>

                {open &&
              <div className="mt-4 space-y-2">
                    <label htmlFor={`reason-${i.id}`} className="block text-micro text-text-secondary">WHY CAN’T THIS BE DONE? (REQUIRED)</label>
                    <textarea
                  id={`reason-${i.id}`}
                  rows={3}
                  autoFocus
                  value={reason}
                  onChange={(e) => {
                    setReason(e.target.value);
                    if (e.target.value.trim()) setShowError(false);
                  }}
                  aria-invalid={showError}
                  placeholder="e.g. No trained staff available; need support from RBC"
                  className={`w-full px-3 py-2 rounded-lg border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary resize-none ${showError ? 'border-danger' : 'border-border'}`} />
                
                    {showError &&
                <p className="flex items-center gap-1.5 text-[12px] text-danger"><AlertCircle size={13} /> Please give a reason before saving.</p>
                }
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setReasonFor(null)} className="px-3 py-2 text-[12px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">Cancel</button>
                      <button onClick={() => confirmReason(i.id)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[12px] font-semibold transition-colors">
                        Save reason
                      </button>
                    </div>
                  </div>
              }
              </li>);

        })}
        </ul>
      }
    </div>);

}