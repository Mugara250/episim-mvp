import React, { useMemo } from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RtTrendCard } from '../components/analyst/RtTrendCard';
import { ScenarioStatusBadge } from '../components/analyst/Badges';
import { interventionPackages } from '../data/interventions';
import { analystScenarios } from '../data/analystScenarios';
import { reportDrafts } from '../data/reportDrafts';
import { caseSeries } from '../data/caseReports';
import { getDisease } from '../lib/models/diseases';
import { estimateRt, trendOf } from '../lib/models/rt';

const TREND_TEXT = {
  growing: { text: 'Likely growing', tone: 'text-danger' },
  shrinking: { text: 'Likely slowing', tone: 'text-success' },
  uncertain: { text: 'Not clear yet', tone: 'text-warning' },
  'not-enough-data': { text: 'Not enough data', tone: 'text-text-secondary' }
};

export function AnalystDashboard({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { userName } = useAuth();
  const go = (route: string) => onNavigate?.(route);
  const series = caseSeries.find((s) => s.diseaseId === 'ebola') ?? caseSeries[0];
  const disease = getDisease(series.diseaseId);
  const points = useMemo(() => estimateRt(series.counts, disease.serialInterval, 7), [series.id, disease.id]);
  const latest = [...points].reverse().find((p) => p.rt !== null);
  const trend = TREND_TEXT[trendOf(latest)];

  const runThisWeek = analystScenarios.filter((s) => s.thisWeek).length;
  const drafts = reportDrafts.filter((r) => r.status === 'Draft').length;

  const cards = [
  {
    label: 'Current Rt',
    value: latest?.rt != null ? latest.rt.toFixed(2) : '—',
    detail: latest?.low != null ? `95% range ${latest.low.toFixed(2)}–${latest.high?.toFixed(2)} · ` : '',
    extra: trend,
    route: '/rt'
  },
  { label: 'Intervention packages', value: `${interventionPackages.length}`, detail: 'Ready for scenarios', route: '/interventions' },
  { label: 'Scenarios run this week', value: `${runThisWeek}`, detail: 'Ebola and Marburg', route: '/scenario' },
  { label: 'Report drafts in progress', value: `${drafts}`, detail: 'Not yet submitted for approval', route: '/reports' }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Good morning, {userName.split(' ')[0]}</h1>
        <p className="text-body text-text-secondary">
          Spread trend, scenario runs and report drafts for Ebola and Marburg. All results are scenario estimates with uncertainty ranges.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((c) =>
        <button
          key={c.label}
          onClick={() => go(c.route)}
          className="text-left bg-surface p-5 rounded-xl border border-border hover:border-primary/40 transition-colors flex flex-col">
          
            <div className="text-micro text-text-secondary mb-2">{c.label.toUpperCase()}</div>
            <div className="text-kpi text-text-primary">{c.value}</div>
            <div className="text-[12px] text-text-secondary mt-auto pt-1">
              {c.detail}
              {c.extra && <span className={`font-semibold ${c.extra.tone}`}>{c.extra.text}</span>}
            </div>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <RtTrendCard points={points} startDate={series.startDate} label={series.label} onOpen={() => go('/rt')} />

        <section className="bg-surface rounded-xl border border-border">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-h3 text-text-primary">Intervention packages</h2>
            <span className="text-[12px] text-text-secondary">{interventionPackages.length}</span>
          </div>
          <ul className="divide-y divide-border border-t border-border">
            {interventionPackages.map((p) =>
            <li key={p.id}>
                <button
                onClick={() => go('/interventions')}
                className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-background transition-colors">
                
                  <span className="flex-1 min-w-0">
                    <span className="block text-[13px] text-text-primary truncate">{p.name}</span>
                    <span className="block text-[12px] text-text-secondary">
                      {p.items.length} interventions · updated {p.updated}
                    </span>
                  </span>
                  <ChevronRight size={15} className="text-text-secondary flex-shrink-0" />
                </button>
              </li>
            )}
          </ul>
        </section>
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-h3 text-text-primary">Recent scenarios</h2>
          <button onClick={() => go('/scenario')} className="text-[12px] font-semibold text-primary hover:underline flex items-center">
            Scenario Comparison <ArrowRight size={13} className="ml-1" />
          </button>
        </div>
        <table className="w-full text-[13px]">
          <thead className="bg-background border-y border-border">
            <tr className="text-left text-[12px] text-text-secondary">
              <th className="px-6 py-2.5 font-semibold">Name</th>
              <th className="px-6 py-2.5 font-semibold">Disease</th>
              <th className="px-6 py-2.5 font-semibold">Date</th>
              <th className="px-6 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {analystScenarios.map((s) =>
            <tr key={s.id}>
                <td className="px-6 py-3">
                  <div className="text-text-primary font-medium">{s.name}</div>
                  <div className="text-[11px] text-text-secondary">{s.id}</div>
                </td>
                <td className="px-6 py-3 text-text-secondary">{s.disease}</td>
                <td className="px-6 py-3 text-text-secondary whitespace-nowrap">{s.date}</td>
                <td className="px-6 py-3"><ScenarioStatusBadge status={s.status} /></td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>);

}