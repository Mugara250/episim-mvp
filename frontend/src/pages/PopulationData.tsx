import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, Clock, XCircle, ChevronDown, ChevronRight, Database } from 'lucide-react';
import { useImportJob } from '../context/ImportJobContext';
import { useAuth } from '../context/AuthContext';
import { useDataset, useDatasets, useImportJobs } from '../api/population';
import { formatCount } from '../utils/populationImport';

const fmtDate = (iso: string | null | undefined) =>
iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function IllustrativeBadge() {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full bg-warning/15 text-warning text-[11px] font-semibold"
      title="Sample record for the demo, not an official dataset">

      Illustrative
    </span>);

}

function VersionHistory({ datasetId }: {datasetId: string;}) {
  const { data, isLoading, error } = useDataset(datasetId);
  if (isLoading) return <p className="px-6 py-4 text-[13px] text-text-secondary">Loading versions…</p>;
  if (error || !data) return <p className="px-6 py-4 text-[13px] text-danger">Versions couldn’t be loaded.</p>;
  return (
    <div className="px-6 py-4 bg-background space-y-3">
      <p className="text-micro text-text-secondary">VERSION HISTORY</p>
      <ul className="space-y-2">
        {data.versions.map((v) =>
        <li key={v.version} className="text-[13px] text-text-primary flex flex-wrap gap-x-4 gap-y-1">
            <span className="font-semibold">Version {v.version}</span>
            <span className="text-text-secondary">{formatCount(v.population)} people</span>
            <span className="text-text-secondary">{v.districtCount} districts</span>
            <span className="text-text-secondary">{v.format === 'microdata' ? 'Microdata' : v.format === 'aggregate' ? 'Aggregate counts' : v.format}</span>
            <span className="text-text-secondary">
              {fmtDate(v.importedAt)}
              {v.importedBy ? ` · ${v.importedBy}` : ''}
            </span>
            {v.notes && <span className="text-text-secondary basis-full">{v.notes}</span>}
          </li>
        )}
      </ul>
    </div>);

}

export function PopulationData({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { job } = useImportJob();
  const { role } = useAuth();
  const datasets = useDatasets();
  const imports = useImportJobs();
  const [open, setOpen] = useState<string | null>(null);
  const goImport = () => onNavigate?.('/population/import');
  const canImport = role === 'analyst' || role === 'admin';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-h1 text-text-primary mb-1">Population Data</h1>
          <p className="text-body text-text-secondary">Import and manage population datasets</p>
        </div>
        <button
          onClick={goImport}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors shadow-sm">

          <Upload size={16} className="mr-2" />
          {canImport ? 'Import dataset' : 'How importing works'}
        </button>
      </div>

      {job.status !== 'idle' && job.summary &&
      <button
        onClick={goImport}
        className="w-full flex items-center gap-4 bg-surface border border-border hover:border-primary/40 rounded-xl px-5 py-4 text-left transition-colors">

          {job.status === 'completed' ?
        <CheckCircle2 size={18} className="text-success flex-shrink-0" /> :
        job.status === 'failed' ?
        <XCircle size={18} className="text-danger flex-shrink-0" /> :

        <Clock size={18} className="text-primary flex-shrink-0" />
        }
          <span className="flex-1 min-w-0">
            <span className="block text-[13px] font-semibold text-text-primary truncate">
              {job.summary.datasetName} · version {job.summary.version}
            </span>
            <span className="block text-[12px] text-text-secondary">
              {job.status === 'completed' ?
            'Import complete' :
            job.status === 'failed' ?
            'Import stopped. Open to retry.' :
            job.status === 'queued' ?
            'Queued' :
            `Importing · ${Math.round(job.progress)}%`}
            </span>
          </span>
          <span className="text-[12px] font-semibold text-primary">View</span>
        </button>
      }

      {/* Datasets */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-h3 text-text-primary">Datasets</h3>
          <p className="text-[13px] text-text-secondary mt-1">
            Scenarios pin the version they were built on, so importing a new version never changes existing results.
          </p>
        </div>
        {datasets.isLoading ?
        <p className="px-6 py-8 text-[13px] text-text-secondary">Loading datasets…</p> :
        datasets.error ?
        <p className="px-6 py-8 text-[13px] text-danger">Datasets couldn’t be loaded. {datasets.error.message}</p> :
        !datasets.data?.length ?
        <div className="px-6 py-10 text-center">
            <Database size={24} className="mx-auto text-text-secondary mb-3" />
            <p className="text-[13px] text-text-secondary">No population datasets yet. Import a CSV to add one.</p>
          </div> :

        <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  {['DATASET', 'COVERAGE', 'POPULATION', 'VERSION', 'LAST IMPORTED', 'USED BY'].map((h) =>
                <th key={h} className="text-left px-6 py-3 text-micro text-text-secondary">
                      {h}
                    </th>
                )}
                </tr>
              </thead>
              <tbody>
                {datasets.data.map((d) =>
              <React.Fragment key={d.id}>
                    <tr className="border-t border-border">
                      <td className="px-6 py-4 text-[13px] text-text-primary font-medium">
                        <button
                      onClick={() => setOpen(open === d.id ? null : d.id)}
                      className="flex items-center gap-2 text-left hover:text-primary transition-colors"
                      aria-expanded={open === d.id}>

                          {open === d.id ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          <span>{d.name}</span>
                        </button>
                        <span className="flex items-center gap-2 mt-1 ml-6">
                          {d.illustrative && <IllustrativeBadge />}
                          {d.source && <span className="text-[12px] text-text-secondary">{d.source}</span>}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary">{d.coverage || '—'}</td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary tabular-nums">{formatCount(d.population)}</td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary">v{d.version}</td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary">{fmtDate(d.lastImported)}</td>
                      <td className="px-6 py-4 text-[13px] text-text-secondary">
                        {d.scenariosUsing} {d.scenariosUsing === 1 ? 'scenario' : 'scenarios'}
                      </td>
                    </tr>
                    {open === d.id &&
                <tr className="border-t border-border">
                        <td colSpan={6} className="p-0">
                          <VersionHistory datasetId={d.id} />
                        </td>
                      </tr>
                }
                  </React.Fragment>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>

      {/* Recent Imports Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-h3 text-text-primary">Recent Imports</h3>
        </div>
        {imports.isLoading ?
        <p className="px-6 py-8 text-[13px] text-text-secondary">Loading imports…</p> :
        imports.error ?
        <p className="px-6 py-8 text-[13px] text-danger">Imports couldn’t be loaded. {imports.error.message}</p> :
        !imports.data?.length ?
        <p className="px-6 py-8 text-[13px] text-text-secondary">No imports have been run yet.</p> :

        <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-background">
                <tr>
                  {['FILENAME', 'DATASET', 'TYPE', 'ROWS', 'DATE', 'STATUS'].map((h) =>
                <th key={h} className="text-left px-6 py-3 text-micro text-text-secondary">
                      {h}
                    </th>
                )}
                </tr>
              </thead>
              <tbody>
                {imports.data.map((item) =>
              <tr key={item.id} className="border-t border-border">
                    <td className="px-6 py-4 text-[13px] text-text-primary font-medium">
                      <span className="flex items-center">
                        <FileText size={16} className="text-text-secondary mr-2 flex-shrink-0" />
                        {item.fileName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[13px] text-text-secondary">
                      {item.datasetName}
                      {item.resultVersion ? ` · v${item.resultVersion}` : ''}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-text-secondary">{item.format === 'microdata' ? 'Microdata' : 'Aggregate'}</td>
                    <td className="px-6 py-4 text-[13px] text-text-secondary tabular-nums">
                      {item.status === 'completed' ? formatCount(item.validRows) : '—'}
                      {item.errorRows > 0 && <span className="block text-[12px]">{formatCount(item.errorRows)} skipped</span>}
                    </td>
                    <td className="px-6 py-4 text-[13px] text-text-secondary">{fmtDate(item.createdAt)}</td>
                    <td className="px-6 py-4">
                      {item.status === 'completed' &&
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-hover text-primary text-[11px] font-semibold">
                          <CheckCircle2 size={12} className="mr-1" />
                          Completed
                        </span>
                  }
                      {(item.status === 'running' || item.status === 'queued') &&
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-warning/15 text-warning text-[11px] font-semibold">
                          <Clock size={12} className="mr-1" />
                          {item.status === 'queued' ? 'Queued' : 'Processing'}
                        </span>
                  }
                      {item.status === 'failed' &&
                  <span
                    className="inline-flex items-center px-2.5 py-1 rounded-full bg-danger/15 text-danger text-[11px] font-semibold"
                    title={item.errorMessage ?? undefined}>

                          <XCircle size={12} className="mr-1" />
                          Failed
                        </span>
                  }
                    </td>
                  </tr>
              )}
              </tbody>
            </table>
          </div>
        }
      </div>
    </div>);

}
