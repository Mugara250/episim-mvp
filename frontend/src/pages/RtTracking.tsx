import React, { useState } from 'react';
import { ComposedChart, Bar, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Plus, Undo2, TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCaseDatasets, useCaseEntry, useCaseQuality, useRtEstimate } from '../api/rt';
import { getAccessLevel } from '../lib/rbac';
import { CHART, inputCls, labelCls } from '../components/models/chartTheme';

function dateOf(start: string, day: number) {
  const d = new Date(start);
  d.setDate(d.getDate() + day);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const TREND_COPY = {
  growing: { label: 'Speeding up', text: 'Each case is infecting more than one person.', tone: 'text-danger bg-danger/10 border-danger/20', icon: TrendingUp },
  shrinking: { label: 'Slowing down', text: 'Each case is infecting fewer than one person.', tone: 'text-success bg-success/10 border-success/20', icon: TrendingDown },
  uncertain: { label: 'Not clear yet', text: 'The range still crosses 1. Keep reporting daily.', tone: 'text-warning bg-warning/10 border-warning/20', icon: Minus },
  'not-enough-data': { label: 'Not enough data', text: 'Rt needs at least a week of case counts.', tone: 'text-text-secondary bg-surface-2 border-border', icon: Minus }
};

export function RtTracking(_props: {onNavigate?: (route: string) => void;}) {
  const datasets = useCaseDatasets();
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [rtWindow, setRtWindow] = useState(7);
  const { role } = useAuth();
  // Analysts and Public Health Officers can both add daily counts (rt: full / write)
  const canEnter = ['full', 'write'].includes(getAccessLevel(role, 'rt'));
  const [newCount, setNewCount] = useState('');
  const [added, setAdded] = useState<Record<string, number>>({});
  const list = datasets.data ?? [];
  const series = list.find((s) => s.id === chosenId) ?? list[0] ?? null;
  const seriesId = series?.id ?? null;
  const estimate = useRtEstimate(seriesId, rtWindow);
  const quality = useCaseQuality(seriesId);
  const entry = useCaseEntry(seriesId);

  const points = estimate.data?.points ?? [];
  const latest = estimate.data?.latest ?? undefined;
  const trend = estimate.data?.trend ?? 'not-enough-data';
  const copy = TREND_COPY[trend];
  const TrendIcon = copy.icon;
  const startDate = estimate.data?.startDate ?? series?.startDate ?? new Date().toISOString();
  const rows = points.map((p) => ({
    date: dateOf(startDate, p.day),
    cases: p.cases,
    rt: p.rt === null ? null : Number(p.rt.toFixed(2)),
    band: p.low === null || p.high === null ? null : [Number(p.low.toFixed(2)), Number(Math.min(p.high, 6).toFixed(2))]
  }));

  const addDay = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seriesId || newCount === '' || Number(newCount) < 0) return;
    entry.add.mutate(Math.round(Number(newCount)), {
      onSuccess: () => {
        setAdded((x) => ({ ...x, [seriesId]: (x[seriesId] ?? 0) + 1 }));
        setNewCount('');
      }
    });
  };
  const undo = () =>
  seriesId && entry.undo.mutate(undefined, { onSuccess: () => setAdded((x) => ({ ...x, [seriesId]: Math.max(0, (x[seriesId] ?? 1) - 1) })) });

  if (datasets.isLoading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 py-24 text-[13px] text-text-secondary">
        <Loader2 size={16} className="animate-spin" /> Loading case data…
      </div>);

  }
  if (datasets.error || !series) {
    return (
      <div className="max-w-7xl mx-auto bg-surface rounded-xl border border-border p-10 text-center">
        <h2 className="text-h3 text-text-primary">{datasets.error ? 'Case data couldn’t be loaded' : 'No case data yet'}</h2>
        <p className="text-[13px] text-text-secondary mt-1">{datasets.error?.message ?? 'Import a daily case file or enter counts from the Hospital Tracker.'}</p>
      </div>);

  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Rt Tracking</h1>
        <p className="text-body text-text-secondary">
          Uses Health Officers’ daily case counts to show whether the outbreak is speeding up or slowing down.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-surface p-6 rounded-xl border border-border space-y-4">
            <div>
              <label htmlFor="rt-series" className={labelCls}>CASE REPORTS</label>
              <select id="rt-series" className={inputCls} value={series.id} onChange={(e) => setChosenId(e.target.value)}>
                {list.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <p className="text-[11px] text-text-secondary mt-1">{series.source}</p>
              {series.illustrative &&
              <p className="text-[11px] text-warning mt-1">Illustrative sample counts. {series.note}</p>
              }
            </div>
            <div>
              <span className={labelCls}>WINDOW</span>
              <div className="grid grid-cols-2 gap-2">
                {[7, 14].map((w) =>
                <button
                  key={w}
                  onClick={() => setRtWindow(w)}
                  className={`py-2 rounded-lg border text-[13px] font-semibold transition-colors ${rtWindow === w ? 'border-primary bg-hover text-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>
                  
                    {w} days
                  </button>
                )}
              </div>
            </div>
            <p className="text-[12px] text-text-secondary">
              {estimate.data ?
              <>
                  Serial interval ({estimate.data.presetName}): {estimate.data.serialInterval.mean} days (sd {estimate.data.serialInterval.sd})
                  {estimate.data.provisional ? ' · provisional' : ''}
                </> :
              'Serial interval comes from the disease preset.'}
            </p>
            <div className="pt-3 border-t border-border">
              <span className={labelCls}>DATA QUALITY</span>
              <p className={`text-[13px] font-semibold ${quality.data?.status === 'Failed' ? 'text-danger' : quality.data?.status === 'Warnings' ? 'text-warning' : 'text-success'}`}>
                {quality.data?.status ?? '…'}
              </p>
              {(quality.data?.issues ?? []).map((i) =>
              <p key={i.type} className="text-[12px] text-text-secondary">
                  {i.type}: {Array.isArray(i.rows) ? i.rows.join(', ') : i.rows}
                </p>
              )}
              <p className="text-[11px] text-text-secondary mt-1">Counts only, by facility or district. No patient records.</p>
            </div>
          </div>

          {canEnter ?
          <form onSubmit={addDay} className="bg-surface p-6 rounded-xl border border-border space-y-3">
            <h2 className="text-h3 text-text-primary">Add today’s count</h2>
            <p className="text-[12px] text-text-secondary">Adds to “{series.name}” ({series.disease === 'marburg' ? 'Marburg' : 'Ebola'}).</p>
            <label htmlFor="rt-new" className={labelCls}>NEW CASES ON {dateOf(series.startDate, series.days).toUpperCase()}</label>
            <div className="flex gap-2">
              <input id="rt-new" type="number" min={0} className={inputCls} value={newCount} onChange={(e) => setNewCount(e.target.value)} />
              <button type="submit" disabled={entry.add.isPending} className="disabled:opacity-60 bg-primary hover:bg-primary-dark text-white px-4 rounded-lg text-[13px] font-semibold flex items-center transition-colors">
                <Plus size={15} className="mr-1" /> Add
              </button>
            </div>
            {(entry.add.error || entry.undo.error) && <p className="text-[12px] text-danger">{(entry.add.error ?? entry.undo.error)?.message}</p>}
            {(added[series.id] ?? 0) > 0 &&
            <button type="button" onClick={undo} className="text-[12px] text-text-secondary hover:text-text-primary flex items-center">
                <Undo2 size={13} className="mr-1" /> Remove last added day
              </button>
            }
          </form> :

          <div className="bg-surface p-6 rounded-xl border border-border">
              <h2 className="text-h3 text-text-primary">Where the counts come from</h2>
              <p className="text-[13px] text-text-secondary mt-1">
                Daily counts are entered by Health Officers at each hospital. Gaps or late reports can make the trend less certain.
              </p>
            </div>
          }
        </div>

        <div className="space-y-6 min-w-0">
          <div className={`rounded-xl border p-6 flex items-start gap-4 ${copy.tone}`}>
            <TrendIcon size={26} className="flex-shrink-0" />
            <div className="flex-1">
              <div className="text-h2">{copy.label}</div>
              <p className="text-[13px] text-text-secondary mt-1">{copy.text}</p>
            </div>
            {latest && latest.rt !== null &&
            <div className="text-right">
                <div className="text-micro text-text-secondary">LATEST RT</div>
                <div className="text-kpi text-text-primary">{latest.rt.toFixed(2)}</div>
                <div className="text-[12px] text-text-secondary">95%: {latest.low?.toFixed(2)}–{latest.high?.toFixed(2)}</div>
              </div>
            }
          </div>

          <section className="bg-surface p-6 rounded-xl border border-border">
            <h2 className="text-h3 text-text-primary">Daily cases and Rt</h2>
            <p className="text-[12px] text-text-secondary mt-1 mb-4">
              Bars: reported cases. Line: Rt with 95% range. Above the dashed line the outbreak grows. {estimate.data?.note}
            </p>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={rows} margin={{ top: 8, right: 4, left: -8, bottom: 0 }}>
                  <CartesianGrid stroke={CHART.grid} vertical={false} />
                  <XAxis dataKey="date" tick={CHART.tick} axisLine={false} tickLine={false} minTickGap={30} />
                  <YAxis yAxisId="cases" tick={CHART.tick} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                  <YAxis yAxisId="rt" orientation="right" tick={CHART.tick} axisLine={false} tickLine={false} width={36} domain={[0, 'auto']} />
                  <Tooltip
                    contentStyle={CHART.tooltip}
                    formatter={(v, key) => {
                      if (key === 'band') return [Array.isArray(v) ? `${v[0]}–${v[1]}` : '—', 'Rt 95% range'];
                      if (key === 'rt') return [v ?? '—', 'Rt'];
                      return [v, 'Cases'];
                    }} />
                  
                  <Bar yAxisId="cases" dataKey="cases" fill={CHART.muted} fillOpacity={0.5} radius={[3, 3, 0, 0]} />
                  <ReferenceLine yAxisId="rt" y={1} stroke={CHART.danger} strokeDasharray="4 4" />
                  <Area yAxisId="rt" dataKey="band" stroke="none" fill={CHART.primary} fillOpacity={0.18} isAnimationActive={false} connectNulls={false} />
                  <Line yAxisId="rt" dataKey="rt" stroke={CHART.primary} strokeWidth={2} dot={false} isAnimationActive={false} connectNulls={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>
      </div>
    </div>);

}