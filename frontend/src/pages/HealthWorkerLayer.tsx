import React, { useState } from 'react';
import { Play, Loader2, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ownHospital } from '../data/hospital';
import { SliderField, DiseaseToggle, Stat } from '../components/models/Controls';
import { FanChart } from '../components/models/FanChart';
import { CHART, pct, round } from '../components/models/chartTheme';
import { getDisease, DiseaseId } from '../lib/models/diseases';
import { SimResult, SimSettings, defaultSettings, runSEIHFR } from '../lib/models/seihfr';

const RECOGNITION_DAYS = [7, 14, 21, 28];
const HOSPITAL_STAFF = 140;

export function HealthWorkerLayer({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { role } = useAuth();
  const isOfficer = role === 'officer';
  const [form, setForm] = useState<SimSettings>({
    ...defaultSettings('marburg'),
    runs: 200,
    ...(isOfficer ? { pool: HOSPITAL_STAFF } : {})
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<SimResult | null>(null);
  const [timing, setTiming] = useState<{day: number;share: number;cases: number;}[]>([]);
  const d = getDisease(form.diseaseId);
  const set = <K extends keyof SimSettings,>(k: K, v: SimSettings[K]) => setForm({ ...form, [k]: v });

  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      setResult(runSEIHFR(form));
      setTiming(
        RECOGNITION_DAYS.map((day) => {
          const r = runSEIHFR({ ...form, recognitionDay: day, runs: 100 });
          return { day, share: r.hcwShare.median, cases: r.finalCases.median };
        })
      );
      setRunning(false);
    }, 30);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Health-Worker Layer</h1>
        <p className="text-body text-text-secondary">
          {isOfficer ?
          `Run a scenario for staff infection risk at ${ownHospital.name}. Results are estimates across many runs, shown with ranges.` :
          'A small sub-model inside SEIHFR for infection among hospital staff — not a full agent-based model.'}
        </p>
      </div>

      {form.diseaseId === 'marburg' &&
      <p className="flex items-start gap-2 text-[13px] text-text-primary bg-warning/10 border border-warning/20 rounded-xl px-4 py-3">
          <Info size={16} className="text-warning mt-0.5 flex-shrink-0" />
          Essential for Marburg: about 80% of Rwanda’s 2024 cases were health workers, infected before the outbreak was recognised.
        </p>
      }

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <div className="bg-surface p-6 rounded-xl border border-border space-y-5">
          <DiseaseToggle value={form.diseaseId} onChange={(id: DiseaseId) => setForm({ ...defaultSettings(id), runs: 200, pool: form.pool })} />
          <div>
            <label htmlFor="hcw-pool" className="block text-micro text-text-secondary mb-2">HEALTH WORKERS IN THE AREA</label>
            <input id="hcw-pool" type="number" min={10} className="w-full px-3 py-2 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary" value={form.pool} onChange={(e) => set('pool', Math.max(10, Number(e.target.value)))} />
          </div>
          <SliderField label="Protection before recognition" value={form.ppeBefore} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('ppeBefore', v)} hint="Gloves, gowns, masks and infection control used correctly." />
          <SliderField label="Protection after recognition" value={form.ppeAfter} min={0} max={1} step={0.05} format={pct} onChange={(v) => set('ppeAfter', v)} />
          <SliderField label="Outbreak recognised on" value={form.recognitionDay} min={0} max={42} step={1} format={(v) => `Day ${v}`} onChange={(v) => set('recognitionDay', v)} />
          <p className="text-[12px] text-text-secondary">
            Risk per patient-day without protection: {d.hcwRisk} infections ({d.name}).
          </p>
          <button
            onClick={run}
            disabled={running}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-lg text-[13px] font-semibold flex items-center justify-center transition-colors disabled:opacity-60">
            
            {running ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Play size={16} className="mr-2" />}
            {running ? 'Running…' : 'Run health-worker scenario'}
          </button>
        </div>

        <div className="space-y-6 min-w-0">
          {!result ?
          <div className="bg-surface rounded-xl border border-border p-10 text-center">
              <h2 className="text-h3 text-text-primary">No results yet</h2>
              <p className="text-[13px] text-text-secondary mt-1">Run the scenario to see how many cases are health workers.</p>
            </div> :

          <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Stat
                label="Cases that are health workers"
                value={pct(result.hcwShare.median)}
                detail={`5–95%: ${pct(result.hcwShare.low)}–${pct(result.hcwShare.high)}${form.diseaseId === 'marburg' ? ' · Rwanda 2024: ~80%' : ''}`}
                tone={result.hcwShare.median > 0.3 ? 'warning' : 'default'} />
              
                <Stat label="Health workers infected" value={round(result.runs.map((r) => r.hcwInfections).sort((a, b) => a - b)[Math.floor(result.runs.length / 2)])} detail={`of ${form.pool} staff (median)`} />
                <Stat label="Total cases" value={round(result.finalCases.median)} detail={`5–95%: ${round(result.finalCases.low)}–${round(result.finalCases.high)}`} />
              </div>

              <section className="bg-surface p-6 rounded-xl border border-border">
                <h2 className="text-h3 text-text-primary">Health-worker vs community infections</h2>
                <p className="text-[12px] text-text-secondary mt-1 mb-4">Cumulative infections. Full protection starts on day {form.recognitionDay}.</p>
                <FanChart
                series={[
                { key: 'hcw', label: 'Health workers', color: CHART.warning, data: result.hcwCumulative },
                { key: 'community', label: 'Community', color: CHART.primary, data: result.communityCumulative }]
                }
                height={280} />
              
              </section>

              <section className="bg-surface p-6 rounded-xl border border-border">
                <h2 className="text-h3 text-text-primary">Why early recognition matters</h2>
                <p className="text-[12px] text-text-secondary mt-1 mb-4">Same settings, recognised on different days (100 runs each, median).</p>
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[12px] text-text-secondary border-b border-border">
                      <th className="py-2 font-semibold">Recognised on</th>
                      <th className="py-2 font-semibold">Health-worker share</th>
                      <th className="py-2 font-semibold text-right">Total cases</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {timing.map((t) =>
                  <tr key={t.day}>
                        <td className="py-2.5 text-text-primary">Day {t.day}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-3">
                            <div className="h-1.5 w-32 bg-background rounded-full overflow-hidden">
                              <div className="h-full bg-warning rounded-full" style={{ width: `${Math.min(100, t.share * 100)}%` }} />
                            </div>
                            <span className="font-semibold text-text-primary tabular-nums">{pct(t.share)}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-text-primary tabular-nums">{round(t.cases)}</td>
                      </tr>
                  )}
                  </tbody>
                </table>
              </section>
            </>
          }
        </div>
      </div>
    </div>);

}