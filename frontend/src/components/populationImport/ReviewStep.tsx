import React from 'react';
import { Clock, Play } from 'lucide-react';
import { PopulationImportState } from '../../hooks/usePopulationImport';
import { BACKGROUND_THRESHOLD_BYTES } from '../../data/populationImport';
import { formatBytes, formatCount } from '../../utils/populationImport';
import { ImportStatusPanel } from './ImportStatusPanel';

interface ReviewStepProps {
  s: PopulationImportState;
  readOnly: boolean;
  onRetry: () => void;
  onComputeAggregates: () => void;
  onViewDataset: () => void;
}

export function ReviewStep({ s, readOnly, onRetry, onComputeAggregates, onViewDataset }: ReviewStepProps) {
  if (s.job.status !== 'idle' && s.job.summary) {
    return (
      <ImportStatusPanel
        job={s.job}
        onRetry={onRetry}
        onComputeAggregates={onComputeAggregates}
        onViewDataset={onViewDataset}
        onStartOver={s.startOver} />);


  }
  if (!s.file || !s.validation) return null;

  const rows: {label: string;value: React.ReactNode;edit: number;}[] = [
  { label: 'File', value: `${s.file.name} · ${formatBytes(s.file.sizeBytes)}`, edit: 0 },
  { label: 'Format', value: s.format === 'microdata' ? 'Microdata (one row per person)' : 'Aggregate counts', edit: 1 },
  {
    label: 'Records to import',
    value:
    <>
          {s.validation.partial ? '≈ ' : ''}
          {formatCount(s.records)}
          {s.file.rows - s.records > 0 &&
      <span className="text-text-secondary"> · {formatCount(s.file.rows - s.records)} rows with errors left out</span>
      }
        </>,

    edit: 1
  },
  { label: 'Dataset name', value: s.details.name, edit: 2 },
  { label: 'Region', value: s.regionLabel, edit: 2 },
  { label: 'Year', value: s.details.year, edit: 2 },
  { label: 'Source', value: s.details.source, edit: 2 },
  {
    label: 'Version',
    value: s.existing ? `Version ${s.version} (version ${s.existing.latestVersion} stays in use by existing scenarios)` : 'Version 1 (new dataset)',
    edit: 2
  }];


  const background = s.file.sizeBytes > BACKGROUND_THRESHOLD_BYTES;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <h2 className="text-h3 text-text-primary px-6 py-5 border-b border-border">Check before importing</h2>
        <dl className="divide-y divide-border">
          {rows.map((r) =>
          <div key={r.label} className="px-6 py-3.5 grid grid-cols-[150px_1fr_auto] gap-4 items-baseline text-[13px]">
              <dt className="text-text-secondary">{r.label}</dt>
              <dd className="text-text-primary font-medium min-w-0 break-words">{r.value}</dd>
              {!readOnly &&
            <button onClick={() => s.setStep(r.edit)} className="text-[12px] font-semibold text-primary hover:underline">
                  Edit<span className="sr-only"> {r.label}</span>
                </button>
            }
            </div>
          )}
        </dl>
      </section>

      <aside className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-h3 text-text-primary">Ready when you are</h2>
        <p className="text-[13px] text-text-secondary mt-2 flex items-start gap-2">
          <Clock size={15} className="text-primary mt-0.5 flex-shrink-0" />
          {background ?
          'The import runs in the background and takes a few minutes for a file this size. You can leave this page and keep working.' :
          'The import runs in the background and should take under a minute. You can leave this page.'}
        </p>
        <button
          onClick={s.startImport}
          disabled={readOnly}
          className="mt-5 w-full bg-primary hover:bg-primary-dark text-white px-4 py-3 rounded-lg text-[14px] font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          
          <Play size={15} /> Start import
        </button>
      </aside>
    </div>);

}