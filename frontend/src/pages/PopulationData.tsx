import React from 'react';
import { Upload, FileText, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { useImportJob } from '../context/ImportJobContext';

const recentImports = [
{ id: 1, filename: 'census_2026_kigali.csv', type: 'Census', rows: '1.2M', date: '12 Mar 2026', status: 'completed' },
{ id: 2, filename: 'district_boundaries.geojson', type: 'GIS', rows: '30', date: '10 Mar 2026', status: 'completed' },
{ id: 3, filename: 'mobility_matrix_q1.csv', type: 'Mobility', rows: '450K', date: '8 Mar 2026', status: 'processing' },
{ id: 4, filename: 'demographics_age_sex.csv', type: 'Demographics', rows: '2.4M', date: '5 Mar 2026', status: 'completed' }];


export function PopulationData({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { job } = useImportJob();
  const goImport = () => onNavigate?.('/population/import');

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
          Import dataset
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

      {/* Recent Imports Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="p-6 border-b border-border">
          <h3 className="text-h3 text-text-primary">Recent Imports</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background">
              <tr>
                {['FILENAME', 'TYPE', 'ROWS', 'DATE', 'STATUS'].map((h) =>
                <th key={h} className="text-left px-6 py-3 text-micro text-text-secondary">
                    {h}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {recentImports.map((item) =>
              <tr key={item.id} className="border-t border-border">
                  <td className="px-6 py-4 text-[13px] text-text-primary font-medium flex items-center">
                    <FileText size={16} className="text-text-secondary mr-2" />
                    {item.filename}
                  </td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{item.type}</td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{item.rows}</td>
                  <td className="px-6 py-4 text-[13px] text-text-secondary">{item.date}</td>
                  <td className="px-6 py-4">
                    {item.status === 'completed' &&
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-hover text-primary text-[11px] font-semibold">
                        <CheckCircle2 size={12} className="mr-1" />
                        Completed
                      </span>
                  }
                    {item.status === 'processing' &&
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-warning/15 text-warning text-[11px] font-semibold">
                        <Clock size={12} className="mr-1" />
                        Processing
                      </span>
                  }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>);

}