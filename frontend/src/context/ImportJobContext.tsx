import React, { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { SAMPLE_CHECK, SAMPLE_FILE } from '../data/populationImport';
import { AggregateStatus, ImportFormat, ImportStatus } from '../types/populationImport';

export type ImportOutcome = 'succeed' | 'fail';

export interface ImportSummary {
  datasetName: string;
  fileName: string;
  fileSize: number;
  format: ImportFormat;
  records: number;
  skippedRows: number;
  regionLabel: string;
  year: string;
  source: string;
  version: number;
}

export interface ImportJob {
  status: ImportStatus;
  progress: number;
  summary: ImportSummary | null;
  error: string | null;
  startedAt: string | null;
  aggregates: AggregateStatus;
}

interface ImportJobContextType {
  job: ImportJob;
  start: (summary: ImportSummary) => void;
  retry: () => void;
  computeAggregates: () => void;
  reset: () => void;
}

const IDLE: ImportJob = { status: 'idle', progress: 0, summary: null, error: null, startedAt: null, aggregates: 'idle' };
const FAIL_AT = 62;

const SAMPLE_SUMMARY: ImportSummary = {
  datasetName: 'RPHC5 2022 (10% sample)',
  fileName: SAMPLE_FILE.name,
  fileSize: SAMPLE_FILE.sizeBytes,
  format: 'microdata',
  records: SAMPLE_FILE.rows - SAMPLE_CHECK.errorRows,
  skippedRows: SAMPLE_CHECK.errorRows,
  regionLabel: 'All of Rwanda',
  year: '2022',
  source: 'NISR Census',
  version: 2
};

const timeNow = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const failMessage = (summary: ImportSummary) =>
`The connection to the data store dropped after ${Math.round(summary.records * FAIL_AT / 100).toLocaleString('en-US')} rows. Nothing was saved, so you can safely try again.`;

function seededJob(status?: string): ImportJob {
  if (status === 'completed') return { ...IDLE, status: 'completed', progress: 100, summary: SAMPLE_SUMMARY, startedAt: '09:14' };
  if (status === 'failed')
  return { ...IDLE, status: 'failed', progress: FAIL_AT, summary: SAMPLE_SUMMARY, startedAt: '09:14', error: failMessage(SAMPLE_SUMMARY) };
  return IDLE;
}

const ImportJobContext = createContext<ImportJobContextType | undefined>(undefined);

/** Holds the background import so it keeps running when the user leaves the page. */
export function ImportJobProvider({ children, outcome = 'succeed' }: {children: ReactNode;outcome?: ImportOutcome;}) {
  const screenInit = useScreenInit() as {importStatus?: string;};
  const [job, setJob] = useState<ImportJob>(() => seededJob(screenInit.importStatus));
  const timers = useRef<number[]>([]);

  const clear = () => {
    timers.current.forEach((t) => window.clearTimeout(t));
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = useCallback((summary: ImportSummary, willFail: boolean) => {
    clear();
    setJob({ ...IDLE, status: 'queued', summary, startedAt: timeNow() });
    let progress = 0;
    const tick = () => {
      progress = Math.min(100, progress + 2 + Math.random() * 3);
      if (willFail && progress >= FAIL_AT) {
        setJob((j) => ({ ...j, status: 'failed', progress: FAIL_AT, error: failMessage(summary) }));
        return;
      }
      if (progress >= 100) {
        setJob((j) => ({ ...j, status: 'completed', progress: 100 }));
        return;
      }
      setJob((j) => ({ ...j, status: 'running', progress }));
      timers.current.push(window.setTimeout(tick, 140));
    };
    timers.current.push(window.setTimeout(tick, 1400));
  }, []);

  const start = (summary: ImportSummary) => run(summary, outcome === 'fail');
  // A retry is a fresh attempt; in the demo it always succeeds.
  const retry = () => {
    if (job.summary) run(job.summary, false);
  };

  const computeAggregates = () => {
    setJob((j) => ({ ...j, aggregates: 'running' }));
    timers.current.push(window.setTimeout(() => setJob((j) => ({ ...j, aggregates: 'done' })), 2200));
  };

  const reset = () => {
    clear();
    setJob(IDLE);
  };

  return (
    <ImportJobContext.Provider value={{ job, start, retry, computeAggregates, reset }}>{children}</ImportJobContext.Provider>);

}

export function useImportJob() {
  const ctx = useContext(ImportJobContext);
  if (!ctx) throw new Error('useImportJob must be used within ImportJobProvider');
  return ctx;
}