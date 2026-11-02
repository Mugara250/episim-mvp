import React, { useRef, useState } from 'react';
import { AlertCircle, Download, FileSpreadsheet, Loader2, Trash2, UploadCloud, Clock } from 'lucide-react';
import { BACKGROUND_THRESHOLD_BYTES, TEMPLATE_HEADERS, TEMPLATE_ROWS } from '../../data/populationImport';
import { PopulationImportState } from '../../hooks/usePopulationImport';
import { downloadCsv } from '../../utils/csv';
import { formatBytes, formatCount } from '../../utils/populationImport';

export function UploadStep({ s, readOnly }: {s: PopulationImportState;readOnly: boolean;}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const browse = () => inputRef.current?.click();

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (readOnly) return;
    const f = e.dataTransfer.files?.[0];
    if (f) s.upload(f);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-4">
        {s.uploadError &&
        <div role="alert" className="flex items-start gap-3 bg-danger/10 border border-danger/30 rounded-xl px-5 py-4">
            <AlertCircle size={18} className="text-danger mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">{s.uploadError.title}</p>
              <p className="text-[13px] text-text-secondary mt-1">{s.uploadError.detail}</p>
            </div>
          </div>
        }

        {s.file ?
        <section className="bg-surface rounded-xl border border-border p-6">
            <div className="flex items-start gap-4">
              <span className="w-12 h-12 rounded-xl bg-hover text-primary flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet size={22} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-text-primary truncate">{s.file.name}</p>
                <p className="text-[13px] text-text-secondary mt-1">
                  {formatBytes(s.file.sizeBytes)} · {s.file.rowsEstimated ? '≈ ' : ''}
                  {formatCount(s.file.rows)} rows{s.file.rowsEstimated ? ' (estimated)' : ''} · {s.file.columns.length} columns
                </p>
              </div>
              {!readOnly &&
            <button
              onClick={s.removeFile}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors">
              
                  <Trash2 size={14} /> Remove
                </button>
            }
            </div>

            <div className="mt-5 pt-5 border-t border-border">
              <p className="text-micro text-text-secondary mb-2">COLUMNS FOUND</p>
              <div className="flex flex-wrap gap-1.5">
                {s.file.columns.map((c) =>
              <span key={c} className="px-2 py-1 rounded-md bg-surface-2 text-[12px] font-mono text-text-primary">
                    {c}
                  </span>
              )}
              </div>
            </div>

            {s.file.sizeBytes > BACKGROUND_THRESHOLD_BYTES &&
          <p className="mt-5 flex items-start gap-2 text-[13px] text-text-secondary">
                <Clock size={15} className="text-primary mt-0.5 flex-shrink-0" />
                This is a large file, so the import will run in the background. You can keep working while it finishes.
              </p>
          }
          </section> :

        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!readOnly) setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`bg-surface rounded-xl border-2 border-dashed px-8 py-16 flex flex-col items-center text-center transition-colors ${
          readOnly ? 'border-border opacity-60' : dragging ? 'border-primary bg-hover' : 'border-border'}`
          }>
          
            {s.reading ?
          <>
                <Loader2 size={32} className="text-primary animate-spin mb-4" />
                <p className="text-h3 text-text-primary">Reading your file…</p>
                <p className="text-[13px] text-text-secondary mt-1">Counting rows and finding columns.</p>
              </> :

          <>
                <span className="w-16 h-16 rounded-full bg-hover flex items-center justify-center mb-5">
                  <UploadCloud size={28} className="text-primary" />
                </span>
                <h2 className="text-h3 text-text-primary">Drag your census CSV here</h2>
                <p className="text-[13px] text-text-secondary mt-1 mb-6">or choose it from your computer</p>
                <button
              onClick={browse}
              disabled={readOnly}
              className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              
                  Browse files
                </button>
                <input
              ref={inputRef}
              type="file"
              accept=".csv,text/csv"
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose a CSV file"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) s.upload(f);
                e.target.value = '';
              }} />
            
                {!readOnly &&
            <button onClick={s.loadSample} className="mt-6 text-[13px] text-text-secondary hover:text-primary transition-colors">
                    No file to hand? <span className="font-semibold text-primary">Try the RPHC5 2022 10% sample</span>
                  </button>
            }
              </>
          }
          </div>
        }
      </div>

      <aside className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-h3 text-text-primary mb-4">What you can upload</h2>
        <dl className="space-y-4 text-[13px]">
          <div>
            <dt className="text-text-secondary">Format</dt>
            <dd className="text-text-primary mt-0.5">CSV (comma separated, UTF-8) with column names in the first row</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Layout</dt>
            <dd className="text-text-primary mt-0.5">
              One row per person (NISR census microdata), or one row per region and age band (counts)
            </dd>
          </div>
          <div>
            <dt className="text-text-secondary">Maximum size</dt>
            <dd className="text-text-primary mt-0.5">2 GB</dd>
          </div>
          <div>
            <dt className="text-text-secondary">Large files</dt>
            <dd className="text-text-primary mt-0.5">Files over 50 MB import in the background, so you can leave the page</dd>
          </div>
        </dl>
        <button
          onClick={() => downloadCsv('episim_population_template.csv', TEMPLATE_HEADERS, TEMPLATE_ROWS)}
          className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
          
          <Download size={15} /> Download sample template
        </button>
      </aside>
    </div>);

}