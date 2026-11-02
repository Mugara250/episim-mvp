import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, BarChart3, Check, Copy, GitCompare, Loader2, Plus, RotateCcw, X } from 'lucide-react';
import { Scenario } from '../../types/scenarios';
import { SimulationRun } from '../../types/simulationRuns';
import { findPreset } from '../../utils/scenarios';
import { formatCount, formatDuration, isActive } from '../../utils/simulationRuns';

interface RunProgressProps {
  run: SimulationRun;
  scenario: Scenario | undefined;
  canRun: boolean;
  canEditScenario: boolean;
  onCancel: () => void;
  onViewResults: () => void;
  onCompare: () => void;
  onRunAgain: () => void;
  onTryAgain: () => void;
  onEditScenario: () => void;
  onNew: () => void;
}

function useElapsed(run: SimulationRun) {
  const active = isActive(run.status);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [active]);
  return active ? (now - new Date(run.startedAt).getTime()) / 1000 : run.durationSec ?? 0;
}

function Steps({ run }: {run: SimulationRun;}) {
  const final = run.status === 'failed' ? 'Failed' : run.status === 'cancelled' ? 'Cancelled' : 'Completed';
  const steps = ['Queued', 'Running', final];
  const current = run.status === 'queued' ? 0 : run.status === 'running' ? 1 : 2;
  const bad = run.status === 'failed' || run.status === 'cancelled';
  return (
    <ol className="flex items-center gap-2" aria-label="Run status">
      {steps.map((label, i) => {
        const done = i < current || i === 2 && run.status === 'completed';
        const now = i === current && !done;
        const isBad = i === 2 && bad;
        return (
          <React.Fragment key={label}>
            <li className="flex items-center gap-2" aria-current={now ? 'step' : undefined}>
              <span
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-colors duration-200 ${
                isBad ?
                'bg-danger/15 text-danger' :
                done ?
                'bg-success text-white' :
                now ?
                'bg-primary text-white' :
                'bg-surface-2 text-text-secondary'}`
                }>
                
                {isBad ? <X size={14} /> : done ? <Check size={14} /> : now ? <Loader2 size={14} className="animate-spin" /> : i + 1}
              </span>
              <span className={`text-[13px] font-semibold whitespace-nowrap ${now || done || isBad ? 'text-text-primary' : 'text-text-secondary'}`}>{label}</span>
            </li>
            {i < steps.length - 1 && <span className={`flex-1 h-px min-w-[16px] ${i < current ? 'bg-success' : 'bg-border'}`} aria-hidden />}
          </React.Fragment>);

      })}
    </ol>);

}

const secondaryBtn =
'px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors flex items-center gap-2';
const primaryBtn = 'bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors';

export function RunProgress(p: RunProgressProps) {
  const { run, scenario } = p;
  const elapsed = useElapsed(run);
  const disease = findPreset(scenario?.presetId ?? null)?.name;
  const day = Math.round(run.progress * run.horizonDays);

  return (
    <motion.section
      aria-labelledby="run-title"
      aria-live="polite"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
      className="bg-surface rounded-xl border border-border">
      
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[12px] text-text-secondary">{run.id} · {disease ?? 'Unknown disease'}</p>
            <h2 id="run-title" className="text-h3 text-text-primary truncate">{scenario?.name ?? 'Scenario no longer available'}</h2>
            <p className="text-[13px] text-text-secondary mt-1 tabular-nums">
              {run.horizonDays} days · {run.initialCases} initial {run.initialCases === 1 ? 'case' : 'cases'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-text-secondary">{isActive(run.status) ? 'Elapsed' : 'Took'}</p>
            <p className="text-[20px] font-semibold text-text-primary tabular-nums">{formatDuration(elapsed)}</p>
          </div>
        </div>

        <Steps run={run} />

        {run.status === 'queued' &&
        <p className="text-[13px] text-text-secondary">Waiting for a free slot. Runs continue in the background, so you can leave this page.</p>
        }

        {run.status === 'running' &&
        <div>
            <div className="flex justify-between text-[12px] text-text-secondary mb-1.5 tabular-nums">
              <span>Simulating day {day} of {run.horizonDays}</span>
              <span>{Math.round(run.progress * 100)}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-2 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(run.progress * 100)}>
              <div className="h-full bg-primary rounded-full transition-[width] duration-200 ease-out" style={{ width: `${run.progress * 100}%` }} />
            </div>
            <p className="text-[12px] text-text-secondary mt-2">You can leave this page. The run keeps going and appears in History.</p>
          </div>
        }

        {run.status === 'completed' && run.summary &&
        <div>
            <dl className="grid grid-cols-2 lg:grid-cols-4 gap-px rounded-xl overflow-hidden border border-border bg-border">
              {[
            { label: 'Peak infectious', value: formatCount(run.summary.peakInfectious), hint: 'people at once' },
            { label: 'Peak day', value: `Day ${run.summary.peakDay}`, hint: run.summary.peakDay >= run.horizonDays ? 'still rising at the end' : 'after day 0' },
            { label: 'Cumulative deaths', value: formatCount(run.summary.deaths), hint: `by day ${run.horizonDays}` },
            { label: 'Final recovered', value: formatCount(run.summary.recovered), hint: `by day ${run.horizonDays}` }].
            map((t) =>
            <div key={t.label} className="bg-surface p-4">
                  <dt className="text-[12px] text-text-secondary">{t.label}</dt>
                  <dd className="text-[24px] font-semibold text-text-primary tabular-nums leading-tight mt-1">{t.value}</dd>
                  <dd className="text-[11px] text-text-secondary mt-0.5">{t.hint}</dd>
                </div>
            )}
            </dl>
            <p className="text-[11px] text-text-secondary mt-2">Expected course from illustrative placeholder values. Real outbreaks vary.</p>
          </div>
        }

        {run.status === 'failed' &&
        <div className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3">
            <AlertCircle size={17} className="text-danger mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[13px] font-semibold text-text-primary">The simulation didn’t finish</p>
              <p className="text-[13px] text-text-secondary mt-0.5">{run.error}</p>
            </div>
          </div>
        }

        {run.status === 'cancelled' && <p className="text-[13px] text-text-secondary">This run was cancelled. No results were saved.</p>}
      </div>

      <div className="px-6 md:px-8 py-4 border-t border-border flex flex-wrap items-center gap-3">
        {isActive(run.status) ?
        p.canRun &&
        <button onClick={p.onCancel} className={`${secondaryBtn} ml-auto`}>
              <X size={15} /> Cancel run
            </button> :


        <>
            {p.canRun &&
          <button onClick={p.onNew} className="text-[13px] font-semibold text-primary hover:underline flex items-center gap-1.5">
                <Plus size={14} /> New simulation
              </button>
          }
            <div className="ml-auto flex flex-wrap gap-3">
              {run.status === 'completed' &&
            <>
                  {p.canRun &&
              <button onClick={p.onRunAgain} className={secondaryBtn}>
                      <RotateCcw size={15} /> Run again
                    </button>
              }
                  <button onClick={p.onCompare} className={secondaryBtn}>
                    <GitCompare size={15} /> Compare with other runs
                  </button>
                  <button onClick={p.onViewResults} className={primaryBtn}>
                    <BarChart3 size={15} /> View full results
                  </button>
                </>
            }
              {run.status === 'failed' && p.canRun &&
            <>
                  {p.canEditScenario &&
              <button onClick={p.onEditScenario} className={secondaryBtn}>
                      <Copy size={15} /> Edit scenario
                    </button>
              }
                  <button onClick={p.onTryAgain} className={primaryBtn}>
                    <RotateCcw size={15} /> Try again
                  </button>
                </>
            }
              {run.status === 'cancelled' && p.canRun &&
            <button onClick={p.onRunAgain} className={primaryBtn}>
                  <RotateCcw size={15} /> Run again
                </button>
            }
            </div>
          </>
        }
      </div>
    </motion.section>);

}