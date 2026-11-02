import React, { useState } from 'react';
import { Plus, Pencil, Send, Download, ChevronRight, CheckCircle2, BadgeCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DraftEditor } from '../components/analyst/DraftEditor';
import { DraftStatusBadge } from '../components/analyst/Badges';
import { reportDrafts } from '../data/reportDrafts';
import { analystScenarios } from '../data/analystScenarios';
import { DraftStatus, ReportDraft } from '../types/analyst';

const FLOW: DraftStatus[] = ['Draft', 'Pending approval', 'Approved'];
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

function exportDraft(d: ReportDraft) {
  const scenario = analystScenarios.find((s) => s.id === d.scenarioId);
  const text = [
  d.title,
  `Status: ${d.status}${d.approvedBy ? ` (approved by ${d.approvedBy})` : ''}`,
  `Disease: ${d.disease}`,
  `Scenario: ${scenario ? `${scenario.id} · ${scenario.name}` : d.scenarioId}`,
  `Last updated: ${d.updated}`,
  '',
  d.summary,
  '',
  'These results are scenario estimates with uncertainty ranges, not exact predictions.'].
  join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${d.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AnalystReports() {
  const { userName } = useAuth();
  const [drafts, setDrafts] = useState<ReportDraft[]>(reportDrafts);
  const [editing, setEditing] = useState<ReportDraft | null | 'new'>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const counts = FLOW.map((s) => drafts.filter((d) => d.status === s).length);

  const save = (data: Omit<ReportDraft, 'id' | 'updated' | 'status'>) => {
    if (editing === 'new') {
      const id = `RPT-${String(32 + drafts.length).padStart(3, '0')}`;
      setDrafts((list) => [{ ...data, id, updated: today(), status: 'Draft' }, ...list]);
      setNotice(`Draft “${data.title}” saved.`);
    } else if (editing) {
      setDrafts((list) => list.map((d) => d.id === editing.id ? { ...d, ...data, updated: today() } : d));
      setNotice('Draft updated.');
    }
    setEditing(null);
  };

  const submit = (d: ReportDraft) => {
    setDrafts((list) => list.map((x) => x.id === d.id ? { ...x, status: 'Pending approval', updated: today() } : x));
    setNotice(`“${d.title}” was submitted for approval.`);
  };

  const approve = (d: ReportDraft) => {
    setDrafts((list) =>
    list.map((x) => x.id === d.id ? { ...x, status: 'Approved', approvedBy: userName, updated: today() } : x)
    );
    setNotice(`“${d.title}” was approved. Policy makers can now read it.`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Reports</h1>
          <p className="text-body text-text-secondary">Write drafts from your scenarios, submit them for approval, and approve reports before policy makers see them.</p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors self-start md:self-auto">
          
          <Plus size={16} className="mr-2" /> New draft
        </button>
      </div>

      <ol className="flex flex-wrap items-center gap-2" aria-label="Report status flow">
        {FLOW.map((s, i) =>
        <li key={s} className="flex items-center gap-2">
            <span className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 text-[13px]">
              <DraftStatusBadge status={s} />
              <span className="font-semibold text-text-primary tabular-nums">{counts[i]}</span>
            </span>
            {i < FLOW.length - 1 && <ChevronRight size={14} className="text-text-secondary" />}
          </li>
        )}
        <li className="text-[12px] text-text-secondary ml-2">Only approved reports are shared with policy makers.</li>
      </ol>

      {notice &&
      <div role="status" className="flex items-center gap-2 text-[13px] text-success bg-success/10 border border-success/20 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /> <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[12px] text-text-secondary hover:text-text-primary">Dismiss</button>
        </div>
      }

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {drafts.length === 0 ?
        <p className="p-10 text-center text-[13px] text-text-secondary">No reports yet. Start a new draft.</p> :

        <ul className="divide-y divide-border">
            {drafts.map((d) => {
            const scenario = analystScenarios.find((s) => s.id === d.scenarioId);
            return (
              <li key={d.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[14px] font-semibold text-text-primary">{d.title}</h2>
                      <DraftStatusBadge status={d.status} />
                    </div>
                    <p className="text-[12px] text-text-secondary mt-1">
                      {d.id} · {d.disease} · {scenario ? scenario.name : d.scenarioId} · updated {d.updated}
                      {d.approvedBy && ` · approved by ${d.approvedBy}`}
                      {d.status === 'Pending approval' && ' · waiting for approval'}
                    </p>
                    {d.summary && <p className="text-[13px] text-text-secondary mt-2 line-clamp-2">{d.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {d.status === 'Draft' &&
                  <>
                        <button
                      onClick={() => setEditing(d)}
                      className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                      
                          <Pencil size={13} className="mr-1.5" /> Edit
                        </button>
                        <button
                      onClick={() => submit(d)}
                      className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                      
                          <Send size={13} className="mr-1.5" /> Submit for approval
                        </button>
                      </>
                  }
                    {d.status === 'Pending approval' &&
                  <>
                        <button
                      onClick={() => setEditing(d)}
                      className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                      
                          <Pencil size={13} className="mr-1.5" /> Review
                        </button>
                        <button
                      onClick={() => approve(d)}
                      className="bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                      
                          <BadgeCheck size={13} className="mr-1.5" /> Approve
                        </button>
                      </>
                  }
                    <button
                    onClick={() => exportDraft(d)}
                    className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    
                      <Download size={13} className="mr-1.5" /> Export
                    </button>
                  </div>
                </li>);

          })}
          </ul>
        }
      </section>

      {editing &&
      <DraftEditor draft={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSave={save} />
      }
    </div>);

}