import React, { useState } from 'react';
import { X } from 'lucide-react';
import { inputCls, labelCls } from '../models/chartTheme';
import { Report, ReportInput, diseaseLabel, formatDate, useCompletedRuns, useSavedComparisons } from '../../api/reports';

export interface DraftPrefill {
  runId?: string | null;
  comparisonId?: string | null;
}

const REPORT_TYPES: {value: string;label: string;}[] = [
{ value: 'scenario_brief', label: 'Scenario brief' },
{ value: 'intervention_impact', label: 'Intervention impact' },
{ value: 'capacity_review', label: 'Capacity review' },
{ value: 'weekly_situation', label: 'Weekly situation report' }];


const lines = (text: string) => text.split('\n').map((l) => l.trim()).filter(Boolean);

export function DraftEditor({
  draft,
  prefill,
  saving,
  error,
  onClose,
  onSave






}: {draft: Report | null;prefill?: DraftPrefill;saving?: boolean;error?: string | null;onClose: () => void;onSave: (d: ReportInput) => void;}) {
  const runs = useCompletedRuns();
  const comparisons = useSavedComparisons();
  const initialLink = draft?.scenarioComparisonId ?
  `cmp:${draft.scenarioComparisonId}` :
  draft?.simulationRunId ?
  `run:${draft.simulationRunId}` :
  prefill?.comparisonId ?
  `cmp:${prefill.comparisonId}` :
  prefill?.runId ?
  `run:${prefill.runId}` :
  '';
  const [title, setTitle] = useState(draft?.title ?? '');
  const [reportType, setReportType] = useState(draft?.reportType ?? 'scenario_brief');
  const [link, setLink] = useState(initialLink);
  const [summary, setSummary] = useState(draft?.summary ?? '');
  const [keyPoints, setKeyPoints] = useState(((draft?.keyPoints ?? []) as string[]).join('\n'));
  const [recommendations, setRecommendations] = useState(((draft?.recommendations ?? []) as string[]).join('\n'));

  const runList = runs.data ?? [];
  const linkedRun = link.startsWith('run:') ? runList.find((r) => r.id === link.slice(4)) : undefined;
  const disease = linkedRun?.disease ?? draft?.disease ?? '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      reportType,
      audience: 'policy',
      disease,
      simulationRunId: link.startsWith('run:') ? link.slice(4) : null,
      scenarioComparisonId: link.startsWith('cmp:') ? link.slice(4) : null,
      summary: summary.trim(),
      keyPoints: lines(keyPoints),
      recommendations: lines(recommendations),
      // Empty figures: the server fills them from the linked run's results (with ranges).
      figures: []
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-title"
        className="bg-surface rounded-xl border border-border w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">

        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 id="draft-title" className="text-h3 text-text-primary">
            {draft ? draft.status === 'pending_approval' ? 'Review report' : 'Edit draft' : 'New report draft'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary">
            <X size={18} />
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label htmlFor="dr-title" className={labelCls}>TITLE</label>
            <input id="dr-title" className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="dr-type" className={labelCls}>REPORT TYPE</label>
              <select id="dr-type" className={inputCls} value={reportType} onChange={(e) => setReportType(e.target.value)}>
                {REPORT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>DISEASE</label>
              <div className={`${inputCls} text-text-secondary`}>{disease ? diseaseLabel(disease) : 'From the linked run'}</div>
            </div>
          </div>
          <div>
            <label htmlFor="dr-link" className={labelCls}>BASED ON</label>
            <select id="dr-link" className={inputCls} value={link} onChange={(e) => setLink(e.target.value)}>
              <option value="">Nothing linked yet</option>
              {runList.length > 0 &&
              <optgroup label="Completed simulation runs">
                  {runList.map((r) =>
                <option key={r.id} value={`run:${r.id}`}>
                      {r.id} · {r.scenarioName} · {formatDate(r.completedAt ?? r.queuedAt)}
                    </option>
                )}
                </optgroup>
              }
              {(comparisons.data ?? []).length > 0 &&
              <optgroup label="Saved comparisons">
                  {(comparisons.data ?? []).map((c) =>
                <option key={c.id} value={`cmp:${c.id}`}>{c.id} · {c.name}</option>
                )}
                </optgroup>
              }
            </select>
            <p className="text-[11px] text-text-secondary mt-1">
              {runs.isLoading ?
              'Loading completed runs…' :
              runs.isError ?
              'Completed runs could not be loaded.' :
              link.startsWith('run:') ?
              'Key figures (with 5–95% ranges) are filled in from this run’s results.' :
              'Only completed runs can be linked.'}
            </p>
          </div>
          <div>
            <label htmlFor="dr-summary" className={labelCls}>SUMMARY</label>
            <textarea
              id="dr-summary"
              rows={5}
              className={`${inputCls} resize-none`}
              value={summary}
              onChange={(e) => setSummary(e.target.value)} />

            <p className="text-[11px] text-text-secondary mt-1">
              Describe results as scenario estimates with their uncertainty range, not as exact predictions.
            </p>
          </div>
          <div>
            <label htmlFor="dr-points" className={labelCls}>KEY POINTS (ONE PER LINE)</label>
            <textarea id="dr-points" rows={3} className={`${inputCls} resize-none`} value={keyPoints} onChange={(e) => setKeyPoints(e.target.value)} />
          </div>
          <div>
            <label htmlFor="dr-recs" className={labelCls}>RECOMMENDATIONS (ONE PER LINE)</label>
            <textarea id="dr-recs" rows={3} className={`${inputCls} resize-none`} value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
          </div>
          {error &&
          <p role="alert" className="text-[12px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{error}</p>
          }
        </div>
        <div className="flex justify-end gap-3 p-5 border-t border-border bg-background/50 rounded-b-xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-[13px] font-semibold text-text-secondary hover:bg-hover rounded-lg transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!title.trim() || saving}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

            {saving ? 'Saving…' : 'Save draft'}
          </button>
        </div>
      </form>
    </div>);

}
