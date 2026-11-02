import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Pencil, Send, Download, ChevronRight, CheckCircle2, BadgeCheck, AlertTriangle, Undo2, Loader2 } from 'lucide-react';
import { DraftEditor, DraftPrefill } from '../components/analyst/DraftEditor';
import { DraftStatusBadge } from '../components/analyst/Badges';
import { useAuth } from '../context/AuthContext';
import {
  Report,
  ReportInput,
  diseaseLabel,
  formatDate,
  statusLabel,
  useApproveReport,
  useCreateReport,
  useExportReport,
  useReports,
  useReturnReport,
  useSubmitReport,
  useUpdateReport } from
'../api/reports';

const FLOW = ['Draft', 'Pending approval', 'Approved'] as const;

const btnSecondary =
'bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors disabled:opacity-50';
const btnPrimary =
'bg-primary hover:bg-primary-dark text-white px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors disabled:opacity-50';

type Notice = {tone: 'success' | 'error';text: string;};

export function AnalystReports() {
  const { userName } = useAuth();
  const [params, setParams] = useSearchParams();
  const reports = useReports();
  const create = useCreateReport();
  const update = useUpdateReport();
  const submitM = useSubmitReport();
  const returnM = useReturnReport();
  const approveM = useApproveReport();
  const exportM = useExportReport();

  const [editing, setEditing] = useState<Report | null | 'new'>(null);
  const [prefill, setPrefill] = useState<DraftPrefill | undefined>(undefined);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // /reports?run=RUN-0142 or ?comparison=CMP-… opens a new draft linked to it.
  useEffect(() => {
    const runId = params.get('run');
    const comparisonId = params.get('comparison');
    if (runId || comparisonId) {
      setPrefill({ runId, comparisonId });
      setEditing('new');
      const next = new URLSearchParams(params);
      next.delete('run');
      next.delete('comparison');
      setParams(next, { replace: true });
    }
  }, [params, setParams]);

  const drafts = reports.data ?? [];
  const counts = FLOW.map((s) => drafts.filter((d) => statusLabel(d.status) === s).length);
  const saveError = (create.error ?? update.error) as Error | null;

  const act = async (key: string, fn: () => Promise<unknown>, ok: string) => {
    setBusy(key);
    setNotice(null);
    try {
      await fn();
      setNotice({ tone: 'success', text: ok });
    } catch (e) {
      setNotice({ tone: 'error', text: e instanceof Error ? e.message : 'Something went wrong. Try again.' });
    } finally {
      setBusy(null);
    }
  };

  const save = async (data: ReportInput) => {
    try {
      if (editing === 'new') {
        const r = await create.mutateAsync(data);
        setNotice({ tone: 'success', text: `Draft “${r.title}” saved as ${r.id}.` });
      } else if (editing) {
        await update.mutateAsync({ id: editing.id, body: data });
        setNotice({
          tone: 'success',
          text: editing.status === 'pending_approval' ? 'Changes saved. The report is back in Draft and needs to be submitted again.' : 'Draft updated.'
        });
      }
      setEditing(null);
      setPrefill(undefined);
    } catch {

      // The editor shows the error and stays open.
    }};

  const closeEditor = () => {
    create.reset();
    update.reset();
    setEditing(null);
    setPrefill(undefined);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-2">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Reports</h1>
          <p className="text-body text-text-secondary">Write drafts from your simulation runs, submit them for approval, and approve reports before policy makers see them.</p>
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
        <li className="text-[12px] text-text-secondary ml-2">
          Only approved reports are shared with policy makers. A report must be approved by someone other than its author.
        </li>
      </ol>

      {notice &&
      <div
        role={notice.tone === 'error' ? 'alert' : 'status'}
        className={`flex items-center gap-2 text-[13px] rounded-xl px-4 py-3 border ${notice.tone === 'error' ? 'text-danger bg-danger/10 border-danger/20' : 'text-success bg-success/10 border-success/20'}`}>

          {notice.tone === 'error' ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span className="flex-1">{notice.text}</span>
          <button onClick={() => setNotice(null)} className="text-[12px] text-text-secondary hover:text-text-primary">Dismiss</button>
        </div>
      }

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {reports.isLoading ?
        <p className="p-10 text-center text-[13px] text-text-secondary">Loading reports…</p> :
        reports.isError ?
        <div className="p-10 text-center text-[13px] text-text-secondary">
            <p className="text-danger mb-2">Reports could not be loaded. {(reports.error as Error).message}</p>
            <button onClick={() => reports.refetch()} className="text-primary font-semibold hover:underline">Try again</button>
          </div> :
        drafts.length === 0 ?
        <p className="p-10 text-center text-[13px] text-text-secondary">No reports yet. Start a new draft.</p> :

        <ul className="divide-y divide-border">
            {drafts.map((d) => {
            const status = statusLabel(d.status);
            const link = d.simulationRunId ?? d.scenarioComparisonId ?? d.scenarioRef;
            const isAuthor = d.author === userName;
            return (
              <li key={d.id} className="px-6 py-4 flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h2 className="text-[14px] font-semibold text-text-primary">{d.title}</h2>
                      <DraftStatusBadge status={status} />
                      {d.provisional &&
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Provisional</span>
                    }
                      {d.illustrative &&
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">Illustrative</span>
                    }
                    </div>
                    <p className="text-[12px] text-text-secondary mt-1">
                      {d.id} · {diseaseLabel(d.disease)}
                      {link && ` · ${link}`} · {d.author} · updated {formatDate(d.updated)}
                      {d.approvedBy && ` · approved by ${d.approvedBy}`}
                      {d.status === 'pending_approval' && (isAuthor ? ' · waiting for another Epidemiologist to approve' : ' · waiting for approval')}
                    </p>
                    {d.summary && <p className="text-[13px] text-text-secondary mt-2 line-clamp-2">{d.summary}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                    {d.status === 'draft' &&
                  <>
                        <button onClick={() => setEditing(d)} className={btnSecondary}>
                          <Pencil size={13} className="mr-1.5" /> Edit
                        </button>
                        <button
                      disabled={busy !== null}
                      onClick={() => act(`submit-${d.id}`, () => submitM.mutateAsync(d.id), `“${d.title}” was submitted for approval.`)}
                      className={btnPrimary}>

                          <Send size={13} className="mr-1.5" /> Submit for approval
                        </button>
                      </>
                  }
                    {d.status === 'pending_approval' &&
                  <>
                        <button onClick={() => setEditing(d)} className={btnSecondary}>
                          <Pencil size={13} className="mr-1.5" /> Review
                        </button>
                        <button
                      disabled={busy !== null}
                      onClick={() => act(`return-${d.id}`, () => returnM.mutateAsync(d.id), `“${d.title}” was sent back to Draft.`)}
                      className={btnSecondary}>

                          <Undo2 size={13} className="mr-1.5" /> Return to draft
                        </button>
                        <button
                      disabled={busy !== null}
                      onClick={() =>
                      act(`approve-${d.id}`, () => approveM.mutateAsync(d.id), `“${d.title}” was approved. Policy makers can now read it.`)
                      }
                      className={btnPrimary}>

                          <BadgeCheck size={13} className="mr-1.5" /> Approve
                        </button>
                      </>
                  }
                    <button
                    disabled={busy !== null}
                    onClick={() => act(`export-${d.id}`, () => exportM.mutateAsync(d), `PDF for “${d.title}” generated and downloaded.`)}
                    className={btnSecondary}>

                      {busy === `export-${d.id}` ?
                    <Loader2 size={13} className="mr-1.5 animate-spin" /> :
                    <Download size={13} className="mr-1.5" />
                    }
                      Export PDF
                    </button>
                  </div>
                </li>);

          })}
          </ul>
        }
      </section>

      <p className="text-[12px] text-text-secondary">
        Every report carries the line: “These results are scenario estimates with uncertainty ranges, not exact predictions.”
      </p>

      {editing &&
      <DraftEditor
        draft={editing === 'new' ? null : editing}
        prefill={editing === 'new' ? prefill : undefined}
        saving={create.isPending || update.isPending}
        error={saveError ? saveError.message : null}
        onClose={closeEditor}
        onSave={save} />

      }
    </div>);

}
