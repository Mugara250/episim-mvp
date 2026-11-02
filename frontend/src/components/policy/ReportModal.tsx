import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { ApprovedReport } from '../../types/policy';
import { downloadReportPdf } from '../../utils/reportPdf';

export function ReportModal({ report, onClose }: {report: ApprovedReport;onClose: () => void;}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
            <h2 id="pm-report-title" className="text-h2 text-text-primary">{report.title}</h2>
            <p className="text-[12px] text-text-secondary mt-1">
              {report.disease} · {report.type} · approved by {report.approvedBy} on {report.approvedOn}
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </header>
        <div className="p-6 space-y-6 overflow-y-auto">
          <p className="text-[15px] text-text-primary leading-relaxed">{report.summary}</p>
          <section>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">Key points</h3>
            <ul className="list-disc pl-5 space-y-1 text-[13px] text-text-secondary">
              {report.keyPoints.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
          <section>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">Key figures</h3>
            <dl className="divide-y divide-border border-y border-border text-[13px]">
              {report.figures.map((f) =>
              <div key={f.label} className="flex justify-between gap-4 py-3">
                  <dt className="text-text-secondary">{f.label}</dt>
                  <dd className="font-semibold text-text-primary text-right">{f.range}</dd>
                </div>
              )}
            </dl>
          </section>
          <section>
            <h3 className="text-[13px] font-semibold text-text-primary mb-2">What we recommend</h3>
            <ul className="list-disc pl-5 space-y-1 text-[13px] text-text-secondary">
              {report.recommendations.map((p) => <li key={p}>{p}</li>)}
            </ul>
          </section>
          <p className="text-[12px] text-text-secondary">These figures are estimates from many simulated scenarios, not exact predictions.</p>
        </div>
        <footer className="flex justify-end p-5 border-t border-border bg-background/50 rounded-b-xl">
          <button onClick={() => downloadReportPdf(report)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center transition-colors">
            <Download size={14} className="mr-2" /> Download PDF
          </button>
        </footer>
      </article>
    </div>);

}