import React, { useState } from 'react';
import { Play, Loader2, Lock } from 'lucide-react';
import { SliderField, DiseaseToggle } from '../models/Controls';
import { inputCls, labelCls, pct } from '../models/chartTheme';
import { getDisease, DiseaseId } from '../../lib/models/diseases';
import { SimSettings, defaultSettings } from '../../lib/models/seihfr';
import { approvedParameterSets } from '../../data/parameterSets';

export function ScenarioForm({
  running,
  onSave



}: {running: boolean;onSave: (name: string, settings: SimSettings) => void;}) {
  const [name, setName] = useState('');
  const [form, setForm] = useState<SimSettings>({ ...defaultSettings('ebola'), runs: 100 });
  const d = getDisease(form.diseaseId);
  const paramSet = approvedParameterSets.find((p) => p.diseaseId === form.diseaseId);
  const set = <K extends keyof SimSettings,>(k: K, v: SimSettings[K]) => setForm({ ...form, [k]: v });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave(name.trim(), form);
    setName('');
  };

  return (
    <form onSubmit={submit} className="bg-surface p-6 rounded-xl border border-border space-y-5">
      <h2 className="text-h3 text-text-primary">New scenario</h2>
      <div>
        <label htmlFor="sc-name" className={labelCls}>NAME</label>
        <input
          id="sc-name"
          className={inputCls}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Ebola Rubavu · isolation in 3 days" />
        
      </div>
      <DiseaseToggle value={form.diseaseId} onChange={(id: DiseaseId) => setForm({ ...defaultSettings(id), runs: form.runs })} />
      <p className="flex items-start gap-2 text-[12px] text-text-secondary bg-background border border-border rounded-lg px-3 py-2.5">
        <Lock size={13} className="mt-0.5 flex-shrink-0" />
        <span>
          Disease values from approved set {paramSet?.version}: R0 {d.r0.likely} ({d.r0.low}–{d.r0.high}), fatality {pct(d.cfrCommunity)}.
        </span>
      </p>

      <SliderField label="Onset to isolation" value={form.detectionDelay} min={1} max={10} step={0.5} format={(v) => `${v} d`} onChange={(v) => set('detectionDelay', v)} />
      <SliderField label="Safe burials" value={form.safeBurial} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('safeBurial', v)} />
      <SliderField label="Contact tracing" value={form.contactTracing} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('contactTracing', v)} />
      <SliderField label="Health-worker protection" value={form.ppeAfter} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('ppeAfter', v)} />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="sc-beds" className={labelCls}>ISOLATION BEDS</label>
          <input id="sc-beds" type="number" min={0} className={inputCls} value={form.isolationBeds} onChange={(e) => set('isolationBeds', Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label htmlFor="sc-runs" className={labelCls}>RUNS</label>
          <select id="sc-runs" className={inputCls} value={form.runs} onChange={(e) => set('runs', Number(e.target.value))}>
            {[100, 200, 500].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={running || !name.trim()}
        title={!name.trim() ? 'Give the scenario a name first' : undefined}
        className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-[13px] font-semibold flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
        
        {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Play size={16} className="mr-2" />}
        {running ? `Running ${form.runs} simulations…` : 'Run and save'}
      </button>
    </form>);

}