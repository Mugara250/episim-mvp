import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Search, Eye, Download, Loader2, AlertTriangle } from 'lucide-react';
import { ReportModal, reportTypeLabel } from '../components/policy/ReportModal';
import { Report, diseaseLabel, formatDate, useExportReport, useReports } from '../api/reports';

type DiseaseFilter = 'All' | 'Ebola' | 'Marburg';

export function PolicyReports() {
  const { reportId } = useParams();
  const reports = useReports('approved');
  const exportM = useExportReport();
  const [query, setQuery] = useState('');
  const [disease, setDisease] = useState<DiseaseFilter>('All');
  const [openId, setOpenId] = useState<string | null>(reportId ?? null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const all = reports.data ?? [];
  const q = query.trim().toLowerCase();
  const list = all.filter(
    (r) =>
    (disease === 'All' || diseaseLabel(r.disease) === disease) && (
    !q || r.title.toLowerCase().includes(q) || r.summary.toLowerCase().includes(q))
  );
  const open = all.find((r) => r.id === openId) ?? null;

  const download = async (r: Report) => {
    setDownloading(r.id);
    setError(null);
    try {
      await exportM.mutateAsync(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The PDF could not be downloaded.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Reports</h1>
        <p className="text-body text-text-secondary">
          Approved reports only. Open one to read it or download it as a PDF. Results are scenario estimates, not forecasts.
        </p>
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

      {error &&
      <div role="alert" className="flex items-center gap-2 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
          <AlertTriangle size={16} /> <span className="flex-1">{error}</span>
          <button onClick={() => setError(null)} className="text-[12px] text-text-secondary hover:text-text-primary">Dismiss</button>
        </div>
      }

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        {reports.isLoading ?
        <p className="p-10 text-center text-[13px] text-text-secondary">Loading approved reports…</p> :
        reports.isError ?
        <div className="p-10 text-center text-[13px]">
            <p className="text-danger mb-2">Reports could not be loaded. {(reports.error as Error).message}</p>
            <button onClick={() => reports.refetch()} className="text-primary font-semibold hover:underline">Try again</button>
          </div> :
        list.length === 0 ?
        <p className="p-10 text-center text-[13px] text-text-secondary">
            {all.length === 0 ? 'No reports have been approved yet.' : 'No approved reports match your search.'}
          </p> :

        <ul className="divide-y divide-border">
            {list.map((r) =>
          <li key={r.id} className="px-6 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                <button onClick={() => setOpenId(r.id)} className="flex-1 min-w-0 text-left group">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-[14px] font-semibold text-text-primary group-hover:text-primary transition-colors">{r.title}</h2>
                    {r.provisional &&
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Provisional</span>
                }
                    {r.illustrative &&
                <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">Illustrative</span>
                }
                  </div>
                  <p className="text-[12px] text-text-secondary mt-1">
                    {diseaseLabel(r.disease)} · {reportTypeLabel(r.reportType)} · approved {formatDate(r.approvedOn)} by {r.approvedBy ?? '—'}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-2 line-clamp-2">{r.summary}</p>
                </button>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => setOpenId(r.id)} className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors">
                    <Eye size={13} className="mr-1.5" /> Open
                  </button>
                  <button
                disabled={downloading !== null}
                onClick={() => download(r)}
                className="bg-surface border border-border hover:border-primary/40 text-text-primary px-3 py-2 rounded-lg text-[12px] font-semibold flex items-center transition-colors disabled:opacity-50">
                
                    {downloading === r.id ? <Loader2 size={13} className="mr-1.5 animate-spin" /> : <Download size={13} className="mr-1.5" />}
                    Download PDF
                  </button>
                </div>
              </li>
          )}
          </ul>
        }
      </section>

      {open &&
      <ReportModal report={open} downloading={downloading === open.id} onDownload={() => download(open)} onClose={() => setOpenId(null)} />
      }
    </div>);

}
