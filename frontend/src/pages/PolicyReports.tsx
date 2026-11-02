import React, { useState } from 'react';
import { Search, Eye, Download } from 'lucide-react';
import { ReportModal } from '../components/policy/ReportModal';
import { approvedReports } from '../data/approvedReports';
import { ApprovedReport } from '../types/policy';
import { downloadReportPdf } from '../utils/reportPdf';

type DiseaseFilter = 'All' | 'Ebola' | 'Marburg';

export function PolicyReports() {
  const [query, setQuery] = useState('');
  const [disease, setDisease] = useState<DiseaseFilter>('All');
  const [open, setOpen] = useState<ApprovedReport | null>(null);

  const q = query.trim().toLowerCase();
  const list = approvedReports.filter(
    (r) =>
    (disease === 'All' || r.disease === disease) && (
    !q || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Reports</h1>
        <p className="text-body text-text-secondary">Approved reports only. Open one to read it or download it as a PDF.</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <label className="relative flex-1">
          <span className="sr-only">Search reports</span>
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title or summary"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-surface text-[13px] text-text-primary focus:outline-none focus:border-primary" />
          
        </label>
        <label className="flex items-center gap-2 text-[13px] text-text-secondary">
          Disease
          <select
            value={disease}
            onChange={(e) => setDisease(e.target.value as DiseaseFilter)}
            className="px-3 py-2.5 rounded-lg border border-border bg-surface text-[13px] text-text-primary focus:outline-none focus:border-primary">
            
            <option>All</option>
            <option>Ebola</option>
            <option>Marburg</option>
          </select>
        </label>
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {list.length === 0 ?
        <p className="p-10 text-center text-[13px] text-text-secondary">No approved reports match your search.</p> :

        <ul className="divide-y divide-border">
            {list.map((r) =>
          <li key={r.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <button onClick={() => setOpen(r)} className="flex-1 min-w-0 text-left group">
                  <h2 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">{r.title}</h2>
                  <p className="text-[12px] text-text-secondary mt-1">
                    {r.disease} · {r.type} · approved {r.approvedOn} by {r.approvedBy}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-2 line-clamp-2">{r.summary}</p>
                </button>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setOpen(r)} className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    <Eye size={13} className="mr-1.5" /> Open
                  </button>
                  <button onClick={() => downloadReportPdf(r)} className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    <Download size={13} className="mr-1.5" /> Download PDF
                  </button>
                </div>
              </li>
          )}
          </ul>
        }
      </section>

      {open && <ReportModal report={open} onClose={() => setOpen(null)} />}
    </div>);

}