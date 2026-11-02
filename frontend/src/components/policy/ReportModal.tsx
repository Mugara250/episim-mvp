import { useEffect } from 'react';
import { X, Download, Loader2 } from 'lucide-react';
import { Report, diseaseLabel, formatDate } from '../../api/reports';

const TYPE_LABEL: Record<string, string> = {
  scenario_brief: 'Scenario brief',
  intervention_impact: 'Intervention impact',
  capacity_review: 'Capacity review',
  weekly_situation: 'Weekly situation report'
};

export const reportTypeLabel = (t: string) => TYPE_LABEL[t] ?? t;

interface Figure {
  label: string;
  value?: string;
  range?: string;
}

export function ReportModal({
  report,
  downloading,
  onDownload,
  onClose




}: {report: Report;downloading?: boolean;onDownload: () => void;onClose: () => void;}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const keyPoints = (report.keyPoints ?? []) as string[];
  const recommendations = (report.recommendations ?? []) as string[];
  const figures = (report.figures ?? []) as Figure[];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <article
        role="dialog"
        aria-modal="true"
        aria-labelledby="pm-report-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-surface rounded-xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
        
        <header className="flex items-start justify-between gap-4 p-6 border-b border-border">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="pm-report-title" className="text-h2 text-text-primary">{report.title}</h2>
              {report.provisional &&
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Provisional</span>
              }
              {report.illustrative &&
              <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">Illustrative</span>
              }
            </div>
            <p className="text-[12px] text-text-secondary mt-1">
              {diseaseLabel(report.disease)} · {reportTypeLabel(report.reportType)} · approved by {report.approvedBy ?? '—'} on {formatDate(report.approvedOn)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </header>
        <div className="p-6 space-y-6 overflow-y-auto">
          <p className="text-[15px] text-text-primary leading-relaxed">{report.summary || 'No summary was written for this report.'}</p>
          {keyPoints.length > 0 &&
          <section>
              <h3 className="text-[13px] font-semibold text-text-primary mb-2">Key points</h3>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-text-secondary">
                {keyPoints.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </section>
          }
          {figures.length > 0 &&
          <section>
              <h3 className="text-[13px] font-semibold text-text-primary mb-2">Key figures</h3>
              <dl className="divide-y divide-border border-y border-border text-[13px]">
                {figures.map((f) =>
              <div key={f.label} className="flex justify-between gap-4 py-3">
                    <dt className="text-text-secondary">{f.label}</dt>
                    <dd className="text-right">
                      {f.value && <span className="font-semibold text-text-primary">{f.value}</span>}
                      {f.range && <span className="block text-[12px] text-text-secondary">{f.range}</span>}
                    </dd>
                  </div>
              )}
              </dl>
            </section>
          }
          {recommendations.length > 0 &&
          <section>
              <h3 className="text-[13px] font-semibold text-text-primary mb-2">What we recommend</h3>
              <ul className="list-disc pl-5 space-y-1 text-[13px] text-text-secondary">
                {recommendations.map((p) => <li key={p}>{p}</li>)}
              </ul>
            </section>
          }
          <p className="text-[12px] text-text-secondary">{report.estimateNote}</p>
        </div>
        <footer className="flex justify-end p-5 border-t border-border bg-background/50 rounded-b-xl">
          <button
            onClick={onDownload}
            disabled={downloading}
            className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center transition-colors disabled:opacity-50">
            
            {downloading ? <Loader2 size={14} className="mr-2 animate-spin" /> : <Download size={14} className="mr-2" />} Download PDF
          </button>
        </footer>
      </article>
    </div>);

}
