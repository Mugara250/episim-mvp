import { FolderOpen, Loader2, Lock, PlayCircle } from 'lucide-react';
import { useScenarioRefs } from '../../api/scenarios';
import { useDistrictOptions } from '../../api/simulations';
import { DEFAULT_HCW, SimulationForm } from '../../hooks/useSimulationForm';
import { Scenario } from '../../types/scenarios';
import { HcwSettings, ModelType } from '../../types/simulationRuns';
import { HORIZON_CHOICES, MODEL_LABELS } from '../../utils/simulationRuns';
import { ScenarioPicker } from './ScenarioPicker';
import { WhatWillRun } from './WhatWillRun';

interface NewSimulationCardProps {
  form: SimulationForm;
  scenarios: Scenario[];
  userId: string;
  readOnly: boolean;
  starting?: boolean;
  onRun: () => void;
  onOpenLibrary?: () => void;
}

const fieldCls = (error?: string) =>
`w-full px-3 py-2.5 rounded-lg border bg-background text-[14px] text-text-primary tabular-nums focus:outline-none disabled:opacity-60 ${
error ? 'border-danger focus:border-danger' : 'border-border focus:border-primary'}`;


const MODEL_HELP: Record<ModelType, string> = {
  seihfr: 'One well-mixed population: the whole dataset as a single area.',
  seihfr_geo: 'Each district runs its own outbreak, linked by estimated travel between districts (gravity model).'
};

const HCW_FIELDS: {key: keyof HcwSettings;label: string;min: number;max: number;step: number;pct?: boolean;}[] = [
{ key: 'pool', label: 'Health workers in the area', min: 1, max: 100000, step: 1 },
{ key: 'ppeBefore', label: 'Protection before recognition', min: 0, max: 1, step: 0.05, pct: true },
{ key: 'ppeAfter', label: 'Protection after recognition', min: 0, max: 1, step: 0.05, pct: true },
{ key: 'recognitionDay', label: 'Day the outbreak is recognised', min: 0, max: 365, step: 1 }];


export function NewSimulationCard({ form, scenarios, userId, readOnly, starting, onRun, onOpenLibrary }: NewSimulationCardProps) {
  const geo = form.modelType === 'seihfr_geo';
  const districts = useDistrictOptions(geo);
  const allowed = form.scenario?.districtCodes ?? [];
  const districtList = (districts.data ?? []).filter((d) => !allowed.length || allowed.includes(d.code));
  const refs = useScenarioRefs();
  const preset = refs.presets.find((p) => p.id === form.scenario?.presetId);
  const hcwDefaults: HcwSettings = preset ?
  { pool: DEFAULT_HCW.pool, ppeBefore: preset.hcwPpeBefore, ppeAfter: preset.hcwPpeAfter, recognitionDay: preset.hcwRecognitionDay } :
  DEFAULT_HCW;
  const setHcwField = (key: keyof HcwSettings, raw: string) => {
    const v = Number(raw);
    if (Number.isNaN(v)) return;
    form.setHcw({ ...(form.hcw ?? hcwDefaults), [key]: v });
  };
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

          <ScenarioPicker scenarios={scenarios} value={form.scenarioId} onChange={form.setScenarioId} userId={userId} disabled={readOnly} />
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

        <fieldset>
          <legend className="block text-[13px] font-semibold text-text-primary mb-1.5">4. Model</legend>
          <div role="radiogroup" className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {(Object.keys(MODEL_LABELS) as ModelType[]).map((m) =>
            <label
              key={m}
              className={`flex items-start gap-3 rounded-lg border px-4 py-3 ${readOnly ? 'opacity-60' : 'cursor-pointer'} ${
              form.modelType === m ? 'border-primary bg-hover' : 'border-border hover:border-primary/40'}`
              }>
              
                <input
                type="radio"
                name="model-type"
                className="accent-primary mt-1"
                disabled={readOnly}
                checked={form.modelType === m}
                onChange={() => form.setModelType(m)} />
              
                <span>
                  <span className="block text-[13px] font-semibold text-text-primary">{MODEL_LABELS[m]}</span>
                  <span className="block text-[12px] text-text-secondary">{MODEL_HELP[m]}</span>
                </span>
              </label>
            )}
          </div>
          {geo &&
          <div className="mt-3 max-w-sm">
              <label htmlFor="sim-district" className="block text-[13px] font-medium text-text-primary mb-1.5">District where the outbreak starts</label>
              <select
              id="sim-district"
              disabled={readOnly || districts.isLoading}
              value={form.seedDistrictCode ?? ''}
              onChange={(e) => form.setSeedDistrictCode(e.target.value || null)}
              aria-invalid={!!form.errors.district}
              className={fieldCls(form.errors.district)}>
              
                <option value="">{districts.isLoading ? 'Loading districts…' : 'Choose a district'}</option>
                {districtList.map((d) =>
              <option key={d.code} value={d.code}>{d.name}</option>
              )}
              </select>
              <p className={`text-[12px] mt-1.5 ${form.errors.district ? 'text-danger' : 'text-text-secondary'}`}>
                {form.errors.district ??
              (districts.error ?
              `Districts couldn’t be loaded: ${districts.error.message}` :
              'Travel between districts is estimated, not measured. It is the largest uncertainty in where the outbreak goes.')}
              </p>
            </div>
          }
        </fieldset>

        <details className="rounded-lg border border-border bg-background px-4 py-3" open={!!form.hcw}>
          <summary className="text-[13px] font-semibold text-text-primary cursor-pointer select-none">
            5. Health-worker settings <span className="font-normal text-text-secondary">· Optional</span>
          </summary>
          <p className="text-[12px] text-text-secondary mt-2">
            {form.hcw ? 'Custom values for this run.' : 'Uses the disease preset’s defaults unless you change a value.'} All defaults are placeholders.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            {HCW_FIELDS.map((f) => {
              const value = (form.hcw ?? hcwDefaults)[f.key];
              return (
                <div key={f.key}>
                  <label htmlFor={`hcw-${f.key}`} className="block text-[12px] text-text-secondary mb-1">{f.label}{f.pct ? ' (%)' : ''}</label>
                  <input
                    id={`hcw-${f.key}`}
                    type="number"
                    disabled={readOnly}
                    min={f.pct ? 0 : f.min}
                    max={f.pct ? 100 : f.max}
                    step={f.pct ? 5 : f.step}
                    value={f.pct ? Math.round(value * 100) : value}
                    onChange={(e) => setHcwField(f.key, f.pct ? String(Number(e.target.value) / 100) : e.target.value)}
                    className={`${fieldCls()} max-w-[160px]`} />
                  
                </div>);

            })}
          </div>
          {form.hcw &&
          <button type="button" onClick={() => form.setHcw(null)} className="mt-3 text-[12px] font-semibold text-primary hover:underline">
              Use the preset defaults
            </button>
          }
        </details>
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
          disabled={!form.scenario || starting}
          title={!form.scenario ? 'Choose a scenario first' : undefined}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          
            {starting ? <Loader2 size={16} className="animate-spin" /> : <PlayCircle size={16} />} Run simulation
          </button>
        </div>
      }
    </section>);

}