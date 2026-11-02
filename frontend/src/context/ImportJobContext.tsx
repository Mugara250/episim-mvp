import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { fetchImportJob, populationKeys, startImport, StartImportInput } from '../api/population';
import { AggregateStatus, ImportFormat, ImportStatus } from '../types/populationImport';

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
  /** Server job id once the upload is accepted. */
  id: string | null;
  status: ImportStatus;
  progress: number;
  summary: ImportSummary | null;
  error: string | null;
  startedAt: string | null;
  aggregates: AggregateStatus;
}

interface ImportJobContextType {
  job: ImportJob;
  start: (summary: ImportSummary, input: StartImportInput) => void;
  retry: () => void;
  /** District totals are computed by the server during the import; kept for the panel's interface. */
  computeAggregates: () => void;
  reset: () => void;
}

const IDLE: ImportJob = { id: null, status: 'idle', progress: 0, summary: null, error: null, startedAt: null, aggregates: 'idle' };
const POLL_MS = 700;

const timeNow = () => new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

const ImportJobContext = createContext<ImportJobContextType | undefined>(undefined);

/** Holds the background import so it keeps running (and is polled) when the user leaves the page. */
export function ImportJobProvider({ children }: {children: ReactNode;}) {
  const queryClient = useQueryClient();
  const [job, setJob] = useState<ImportJob>(IDLE);
  const lastInput = useRef<{summary: ImportSummary;input: StartImportInput;} | null>(null);
  const timer = useRef<number | null>(null);

  const stopPolling = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stopPolling, []);

  const poll = useCallback(
    (id: string) => {
      const tick = async () => {
        try {
          const j = await fetchImportJob(id);
          const status = j.status as ImportStatus;
          setJob((cur) => {
            if (cur.id !== id) return cur;
            const summary = cur.summary && {
              ...cur.summary,
              records: j.validRows || cur.summary.records,
              skippedRows: j.status === 'completed' ? j.errorRows : cur.summary.skippedRows,
              version: j.resultVersion ?? cur.summary.version
            };
            return {
              ...cur,
              status,
              progress: Math.round((j.progress ?? 0) * 100),
              summary,
              error: j.errorMessage ?? null,
              aggregates: status === 'completed' ? 'done' : cur.aggregates
            };
          });
          if (status === 'completed' || status === 'failed') {
            queryClient.invalidateQueries({ queryKey: ['population'] });
            return;
          }
        } catch (e) {
          setJob((cur) => cur.id === id ? { ...cur, status: 'failed', error: e instanceof Error ? e.message : 'Lost contact with the import.' } : cur);
          return;
        }
        timer.current = window.setTimeout(tick, POLL_MS);
      };
      stopPolling();
      timer.current = window.setTimeout(tick, POLL_MS);
    },
    [queryClient]
  );

  const run = useCallback(
    async (summary: ImportSummary, input: StartImportInput) => {
      stopPolling();
      lastInput.current = { summary, input };
      setJob({ ...IDLE, status: 'queued', summary, startedAt: timeNow() });
      try {
        const created = await startImport(input);
        setJob((cur) => ({ ...cur, id: created.id, status: created.status as ImportStatus }));
        queryClient.invalidateQueries({ queryKey: populationKeys.imports });
        poll(created.id);
      } catch (e) {
        setJob((cur) => ({ ...cur, status: 'failed', error: e instanceof Error ? e.message : 'The upload was not accepted.' }));
      }
    },
    [poll, queryClient]
  );

  const start = (summary: ImportSummary, input: StartImportInput) => void run(summary, input);
  const retry = () => {
    if (lastInput.current) void run(lastInput.current.summary, lastInput.current.input);
  };
  const computeAggregates = () => setJob((j) => ({ ...j, aggregates: 'done' }));
  const reset = () => {
    stopPolling();
    lastInput.current = null;
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
