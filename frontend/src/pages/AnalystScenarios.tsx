import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { ScenarioForm } from '../components/analyst/ScenarioForm';
import { ScenarioCompare, COMPARE_COLORS } from '../components/analyst/ScenarioCompare';
import { getDisease } from '../lib/models/diseases';
import { SimSettings, defaultSettings, runSEIHFR } from '../lib/models/seihfr';
import { SavedScenario } from '../types/analyst';

const SEEDS: {name: string;settings: SimSettings;}[] = [
{ name: 'Ebola · current response', settings: { ...defaultSettings('ebola'), runs: 100 } },
{ name: 'Ebola · isolation in 3 days, 80% safe burials', settings: { ...defaultSettings('ebola'), detectionDelay: 3, safeBurial: 0.8, runs: 100 } },
{ name: 'Marburg · current response', settings: { ...defaultSettings('marburg'), runs: 100 } }];


function build(name: string, settings: SimSettings, i: number): SavedScenario {
  return { id: `scn-${Date.now()}-${i}`, name, settings, result: runSEIHFR(settings), savedAt: 'Saved earlier' };
}

const MAX_COMPARE = 3;

export function AnalystScenarios() {
  const [scenarios, setScenarios] = useState<SavedScenario[]>(() => SEEDS.map((s, i) => build(s.name, s.settings, i)));
  const [selected, setSelected] = useState<string[]>(() => scenarios.slice(0, 2).map((s) => s.id));
  const [running, setRunning] = useState(false);

  const save = (name: string, settings: SimSettings) => {
    setRunning(true);
    window.setTimeout(() => {
      const s = { ...build(name, { ...settings, seed: Math.floor(Math.random() * 1e9) }, 0), savedAt: 'Just now' };
      setScenarios((list) => [s, ...list]);
      setSelected((sel) => sel.length < MAX_COMPARE ? [...sel, s.id] : sel);
      setRunning(false);
    }, 30);
  };

  const toggle = (id: string) =>
  setSelected((sel) => sel.includes(id) ? sel.filter((x) => x !== id) : sel.length < MAX_COMPARE ? [...sel, id] : sel);

  const remove = (id: string) => {
    setScenarios((list) => list.filter((s) => s.id !== id));
    setSelected((sel) => sel.filter((x) => x !== id));
  };

  const compared = selected.map((id) => scenarios.find((s) => s.id === id)).filter((s): s is SavedScenario => !!s);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Scenario Comparison</h1>
        <p className="text-body text-text-secondary">
          Create, save and compare response scenarios. Each scenario runs the stochastic SEIHFR model many times, so results are shown as ranges.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <ScenarioForm running={running} onSave={save} />

        <div className="space-y-6 min-w-0">
          <section className="bg-surface rounded-xl border border-border">
            <div className="px-6 pt-5 pb-3 flex items-center justify-between">
              <h2 className="text-h3 text-text-primary">Saved scenarios</h2>
              <span className="text-[12px] text-text-secondary">Compare up to {MAX_COMPARE}</span>
            </div>
            {scenarios.length === 0 ?
            <p className="px-6 pb-5 text-[13px] text-text-secondary">No saved scenarios yet. Create one on the left.</p> :

            <ul className="divide-y divide-border border-t border-border">
                {scenarios.map((s) => {
                const idx = selected.indexOf(s.id);
                const checked = idx !== -1;
                const blocked = !checked && selected.length >= MAX_COMPARE;
                return (
                  <li key={s.id} className="px-6 py-3 flex items-center gap-4">
                      <label
                      className={`flex items-center gap-2 text-[12px] font-semibold ${blocked ? 'text-text-secondary/60 cursor-not-allowed' : 'text-text-secondary cursor-pointer'}`}
                      title={blocked ? `You can compare up to ${MAX_COMPARE} scenarios` : undefined}>
                      
                        <input type="checkbox" checked={checked} disabled={blocked} onChange={() => toggle(s.id)} className="accent-primary w-4 h-4" />
                        Compare
                      </label>
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: checked ? COMPARE_COLORS[idx] : 'transparent' }} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium text-text-primary truncate">{s.name}</div>
                        <div className="text-[11px] text-text-secondary">
                          {getDisease(s.settings.diseaseId).name} · {s.settings.runs} runs · {s.savedAt}
                        </div>
                      </div>
                      <button onClick={() => remove(s.id)} aria-label={`Remove ${s.name}`} className="p-1.5 text-text-secondary hover:text-danger transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </li>);

              })}
              </ul>
            }
          </section>

          <ScenarioCompare scenarios={compared} />
        </div>
      </div>
    </div>);

}