import React, { useState } from 'react';
import { Download, Eye, X } from 'lucide-react';
import { hospitalReports } from '../data/hospitalReports';
import { ownHospital } from '../data/hospital';
import { HospitalReport } from '../types/officer';

function exportReport(r: HospitalReport) {
  const text = [
  r.title,
  `${ownHospital.name} · ${r.period}`,
  `Published ${r.published} by ${r.by}`,
  '',
  r.summary,
  '',
  ...r.figures.map((f) => `${f.label}: ${f.value} (${f.range})`),
  '',
  'Projections are scenario estimates with uncertainty ranges, not exact predictions.'].
  join('\n');
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${r.id}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export function OfficerReports() {
  const [viewing, setViewing] = useState<HospitalReport | null>(null);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Reports</h1>
        <p className="text-body text-text-secondary">Published reports for {ownHospital.name} only.</p>
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {hospitalReports.length === 0 ?
        <p className="p-10 text-center text-[13px] text-text-secondary">No reports have been published for your hospital yet.</p> :

        <ul className="divide-y divide-border">
            {hospitalReports.map((r) =>
          <li key={r.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <div className="flex-1 min-w-0">
                  <h2 className="text-[14px] font-semibold text-text-primary">{r.title}</h2>
                  <p className="text-[12px] text-text-secondary mt-1">{r.type} · {r.period} · published {r.published} by {r.by}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setViewing(r)} className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    <Eye size={13} className="mr-1.5" /> View
                  </button>
                  <button onClick={() => exportReport(r)} className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    <Download size={13} className="mr-1.5" /> Export
                  </button>
                </div>
              </li>
          )}
          </ul>
        }
      </section>

      {viewing &&
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={() => setViewing(null)}>
          <article
          role="dialog"
          aria-modal="true"
          aria-labelledby="rep-title"
          onClick={(e) => e.stopPropagation()}
          className="bg-surface rounded-xl border border-border w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
          
            <header className="flex items-start justify-between gap-4 p-6 border-b border-border">
              <div>
                <h2 id="rep-title" className="text-h2 text-text-primary">{viewing.title}</h2>
                <p className="text-[12px] text-text-secondary mt-1">{ownHospital.name} · {viewing.period} · {viewing.by}</p>
              </div>
              <button onClick={() => setViewing(null)} aria-label="Close" className="p-1 text-text-secondary hover:text-text-primary"><X size={18} /></button>
            </header>
            <div className="p-6 space-y-5 overflow-y-auto">
              <p className="text-[14px] text-text-primary leading-relaxed">{viewing.summary}</p>
              <table className="w-full text-[13px]">
                <tbody className="divide-y divide-border border-y border-border">
                  {viewing.figures.map((f) =>
                <tr key={f.label}>
                      <td className="py-3 text-text-secondary">{f.label}</td>
                      <td className="py-3 text-right">
                        <span className="font-semibold text-text-primary tabular-nums">{f.value}</span>
                        <span className="block text-[11px] text-text-secondary">{f.range}</span>
                      </td>
                    </tr>
                )}
                </tbody>
              </table>
              <p className="text-[12px] text-text-secondary">Projections are scenario estimates with uncertainty ranges, not exact predictions.</p>
            </div>
            <footer className="flex justify-end p-5 border-t border-border bg-background/50 rounded-b-xl">
              <button onClick={() => exportReport(viewing)} className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg text-[13px] font-semibold flex items-center transition-colors">
                <Download size={14} className="mr-2" /> Export
              </button>
            </footer>
          </article>
        </div>
      }
    </div>);

}