import React from 'react';
import { FolderOpen, Lock, PlayCircle } from 'lucide-react';
import { SimulationForm } from '../../hooks/useSimulationForm';
import { Scenario } from '../../types/scenarios';
import { HORIZON_CHOICES } from '../../utils/simulationRuns';
import { ScenarioPicker } from './ScenarioPicker';
import { WhatWillRun } from './WhatWillRun';

interface NewSimulationCardProps {
  form: SimulationForm;
  scenarios: Scenario[];
  userName: string;
  readOnly: boolean;
  onRun: () => void;
  onOpenLibrary?: () => void;
}

const fieldCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary tabular-nums focus:outline-none disabled:opacity-60 ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;


export function NewSimulationCard({ form, scenarios, userName, readOnly, onRun, onOpenLibrary }: NewSimulationCardProps) {
  const horizonNum = Number(form.horizon);
  const custom = !HORIZON_CHOICES.includes(horizonNum);

  return (
    <section aria-labelledby="new-sim" className="bg-surface rounded-xl border border-border">
      <div className="p-6 md:p-8 space-y-7">
        <div>
          <h2 id="new-sim" className="text-h3 text-text-primary">New simulation</h2>
          <p className="text-[13px] text-text-secondary mt-1">Pick a saved scenario, set how long to simulate, and run it.</p>
        </div>

        {readOnly &&
        <p className="flex items-start gap-2 rounded-lg border border-border bg-background px-4 py-3 text-[13px] text-text-secondary">
            <Lock size={15} className="mt-0.5 flex-shrink-0" />
            You can view runs on scenarios shared with you in History. Running simulations is done by Epidemiologists and Public Health Officers.
          </p>
        }

        <div>
          <label className="block text-[13px] font-semibold text-text-primary mb-1.5">1. Scenario</label>
          {scenarios.length === 0 ?
          <div className="rounded-lg border border-dashed border-border px-5 py-6 text-center">
              <FolderOpen size={20} className="mx-auto text-primary mb-2" />
              <p className="text-[13px] text-text-primary font-medium">No scenarios to run yet</p>
              <p className="text-[12px] text-text-secondary mt-1">Create one in the Scenario Library, or ask a colleague to share theirs.</p>
              {onOpenLibrary &&
            <button onClick={onOpenLibrary} className="mt-3 text-[13px] font-semibold text-primary hover:underline">Open Scenario Library</button>
            }
            </div> :

          <ScenarioPicker scenarios={scenarios} value={form.scenarioId} onChange={form.setScenarioId} userName={userName} disabled={readOnly} />
          }
        </div>

        {form.scenario && <WhatWillRun scenario={form.scenario} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="sim-horizon" className="block text-[13px] font-semibold text-text-primary mb-1.5">2. Time horizon</label>
            <div className="flex flex-wrap gap-2 mb-2" role="group" aria-label="Quick picks">
              {HORIZON_CHOICES.map((d) =>
              <button
                key={d}
                type="button"
                disabled={readOnly}
                aria-pressed={horizonNum === d}
                onClick={() => form.setHorizon(String(d))}
                className={`px-3 py-1.5 rounded-full border text-[12px] font-semibold transition-colors duration-150 disabled:opacity-60 ${
                horizonNum === d ? 'border-primary bg-primary text-white' : 'border-border text-text-secondary hover:border-primary/40 hover:text-text-primary'}`
                }>
                
                  {d} days
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                id="sim-horizon"
                type="number"
                min={1}
                max={365}
                inputMode="numeric"
                disabled={readOnly}
                value={form.horizon}
                onChange={(e) => form.setHorizon(e.target.value)}
                aria-invalid={!!form.errors.horizon}
                aria-describedby="sim-horizon-help"
                className={`${fieldCls(form.errors.horizon)} max-w-[140px]`} />
              
              <span className="text-[13px] text-text-secondary">days{custom && !form.errors.horizon ? ' (custom)' : ''}</span>
            </div>
            <p id="sim-horizon-help" className={`text-[12px] mt-1.5 ${form.errors.horizon ? 'text-danger' : 'text-text-secondary'}`}>
              {form.errors.horizon ?? 'Between 1 and 365 days. Day 0 is the start of the outbreak.'}
            </p>
          </div>

          <div>
            <label htmlFor="sim-initial" className="block text-[13px] font-semibold text-text-primary mb-1.5">3. Initial infectious cases</label>
            <div className="flex items-center gap-2 md:mt-[38px]">
              <input
                id="sim-initial"
                type="number"
                min={1}
                inputMode="numeric"
                disabled={readOnly}
                value={form.initialCases}
                onChange={(e) => form.setInitialCases(e.target.value)}
                aria-invalid={!!form.errors.initial}
                aria-describedby="sim-initial-help"
                className={`${fieldCls(form.errors.initial)} max-w-[140px]`} />
              
              <span className="text-[13px] text-text-secondary">people</span>
            </div>
            <p id="sim-initial-help" className={`text-[12px] mt-1.5 ${form.errors.initial ? 'text-danger' : 'text-text-secondary'}`}>
              {form.errors.initial ?? 'How many people are infectious at day 0. Early outbreak size has a large effect on results.'}
            </p>
          </div>
        </div>
      </div>

      {!readOnly &&
      <div className="px-6 md:px-8 py-4 border-t border-border flex flex-wrap items-center justify-end gap-3">
          <button
          type="button"
          onClick={form.reset}
          className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
          
            Cancel
          </button>
          <button
          type="button"
          onClick={onRun}
          disabled={!form.scenario}
          title={!form.scenario ? 'Choose a scenario first' : undefined}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          
            <PlayCircle size={16} /> Run simulation
          </button>
        </div>
      }
    </section>);

}