import React from 'react';
import { AlertCircle, ArrowRight, Calculator, CheckCircle2, Clock, Loader2, RotateCcw, Upload } from 'lucide-react';
import { ImportJob } from '../../context/ImportJobContext';
import { formatCount } from '../../utils/populationImport';

interface ImportStatusPanelProps {
  job: ImportJob;
  onRetry: () => void;
  onComputeAggregates: () => void;
  onViewDataset: () => void;
  onStartOver: () => void;
}

const STAGES = ['Queued', 'Running', 'Completed'] as const;

export function ImportStatusPanel({ job, onRetry, onComputeAggregates, onViewDataset, onStartOver }: ImportStatusPanelProps) {
  const sum = job.summary!;
  const failed = job.status === 'failed';
  const stageIndex = job.status === 'queued' ? 0 : job.status === 'running' || failed ? 1 : 2;
  const processed = Math.round(sum.records * job.progress / 100);

  return (
    <section className="bg-surface rounded-xl border border-border overflow-hidden" aria-live="polite">
      <div className="px-6 py-5 border-b border-border flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-h3 text-text-primary">
            {sum.datasetName} · version {sum.version}
          </h2>
          <p className="text-[13px] text-text-secondary mt-1">
            Started at {job.startedAt} · {sum.fileName}
          </p>
        </div>
        <ol className="flex items-center gap-2" aria-label="Import progress">
          {STAGES.map((st, i) => {
            const isFailedStage = failed && i === 1;
            const reached = i <= stageIndex;
            const tone = isFailedStage ?
            'bg-danger/15 text-danger' :
            reached ?
            i === stageIndex && job.status !== 'completed' ?
            'bg-hover text-primary' :
            'bg-success/15 text-success' :
            'bg-surface-2 text-text-secondary';
            return (
              <li key={st} className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${tone}`}>{isFailedStage ? 'Failed' : st}</span>
                {i < STAGES.length - 1 && <span aria-hidden className="w-4 h-px bg-border" />}
              </li>);

          })}
        </ol>
      </div>

      <div className="p-6 space-y-5">
        {job.status === 'queued' &&
        <div className="flex items-start gap-3">
            <Clock size={20} className="text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[14px] font-semibold text-text-primary">Waiting to start</p>
              <p className="text-[13px] text-text-secondary mt-1">Your import is in the queue and will begin in a moment.</p>
            </div>
          </div>
        }

        {(job.status === 'running' || failed) &&
        <div>
            <div className="flex items-baseline justify-between mb-2">
              <p className="text-[14px] font-semibold text-text-primary flex items-center gap-2">
                {!failed && <Loader2 size={15} className="text-primary animate-spin" />}
                {failed ? 'Stopped' : 'Importing rows'}
              </p>
              <p className="text-[13px] text-text-secondary tabular-nums">
                {formatCount(processed)} of {formatCount(sum.records)} · {Math.round(job.progress)}%
              </p>
            </div>
            <div
            className="h-2 rounded-full bg-surface-2 overflow-hidden"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(job.progress)}
            aria-label="Import progress">
            
              <div
              className={`h-full rounded-full transition-[width] duration-150 ease-out ${failed ? 'bg-danger' : 'bg-primary'}`}
              style={{ width: `${job.progress}%` }} />
            
            </div>
          </div>
        }

        {(job.status === 'queued' || job.status === 'running') &&
        <p className="text-[13px] text-text-secondary">
            You can leave this page. The import keeps running and you’ll find it under Population Data when it finishes.
          </p>
        }

        {failed &&
        <div role="alert" className="flex flex-col md:flex-row md:items-center gap-4 bg-danger/10 border border-danger/30 rounded-xl px-5 py-4">
            <AlertCircle size={18} className="text-danger flex-shrink-0" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-text-primary">The import didn’t finish</p>
              <p className="text-[13px] text-text-secondary mt-1">{job.error}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
              onClick={onStartOver}
              className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
              
                Start over
              </button>
              <button
              onClick={onRetry}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors">
              
                <RotateCcw size={14} /> Retry import
              </button>
            </div>
          </div>
        }

        {job.status === 'completed' &&
        <>
            <div className="flex items-start gap-3">
              <CheckCircle2 size={22} className="text-success mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-text-primary">Import complete</p>
                <p className="text-[13px] text-text-secondary mt-1">
                  {formatCount(sum.records)} {sum.format === 'microdata' ? 'people' : 'rows'} imported for {sum.regionLabel}, {sum.year}.
                  {sum.skippedRows > 0 && ` ${formatCount(sum.skippedRows)} rows with errors were left out.`}
                </p>
              </div>
            </div>

            {sum.format === 'microdata' &&
          <div className="rounded-xl border border-border bg-background px-5 py-4 flex flex-col md:flex-row md:items-center gap-4">
                <Calculator size={18} className="text-primary flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-text-primary">
                    {job.aggregates === 'done' ? 'Totals are ready' : 'Next: compute totals for the models'}
                  </p>
                  <p className="text-[13px] text-text-secondary mt-1">
                    {job.aggregates === 'done' ?
                'Population by district, sector, age band and sex: 30 districts, 416 sectors, 17 age bands. The SEIR model can now use this dataset.' :
                'The SEIR model works with population totals by region and age, so EpiSim needs to add up the individual rows first. This takes a few minutes.'}
                  </p>
                </div>
                {job.aggregates !== 'done' &&
            <button
              onClick={onComputeAggregates}
              disabled={job.aggregates === 'running'}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-70 disabled:cursor-wait flex-shrink-0">
              
                    {job.aggregates === 'running' ? <Loader2 size={14} className="animate-spin" /> : <Calculator size={14} />}
                    {job.aggregates === 'running' ? 'Computing…' : 'Compute aggregates'}
                  </button>
            }
              </div>
          }

            <div className="flex flex-wrap gap-3 pt-1">
              <button
              onClick={onViewDataset}
              className={`px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors ${
              sum.format === 'microdata' && job.aggregates !== 'done' ?
              'border border-border text-text-primary hover:border-primary/40' :
              'bg-primary hover:bg-primary-dark text-white'}`
              }>
              
                View dataset <ArrowRight size={14} />
              </button>
              <button
              onClick={onStartOver}
              className="px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors">
              
                <Upload size={14} /> Import another file
              </button>
            </div>
          </>
        }
      </div>
    </section>);

}