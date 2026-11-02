import { ArrowRight, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { RtTrendCard } from '../components/analyst/RtTrendCard';
import { ScenarioStatus, ScenarioStatusBadge } from '../components/analyst/Badges';
import { Trend, useAnalystDashboard, useInterventionPackageList, useRtEstimate } from '../api/dashboard';
import { formatDate } from '../api/reports';

const TREND_TEXT: Record<Trend, {text: string;tone: string;}> = {
  growing: { text: 'Likely growing', tone: 'text-danger' },
  shrinking: { text: 'Likely slowing', tone: 'text-success' },
  uncertain: { text: 'Not clear yet', tone: 'text-warning' },
  'not-enough-data': { text: 'Not enough data', tone: 'text-text-secondary' }
};

const RUN_STATUS: Record<string, ScenarioStatus> = {
  completed: 'Completed',
  running: 'Running',
  queued: 'Queued',
  failed: 'Failed',
  cancelled: 'Cancelled'
};

export function AnalystDashboard({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const { userName } = useAuth();
  const go = (route: string) => onNavigate?.(route);
  const dash = useAnalystDashboard();
  const packages = useInterventionPackageList();
  const data = dash.data;
  const rtDataset = data?.rt.find((r) => r.disease === 'ebola') ?? data?.rt[0];
  const rt = useRtEstimate(rtDataset?.datasetId);
  const latest = rt.data?.latest ?? rtDataset?.latest ?? null;
  const trend = TREND_TEXT[rt.data?.trend ?? rtDataset?.trend ?? 'not-enough-data'];
  const pkgList = packages.data ?? [];

  const cards = [
  {
    label: 'Current Rt',
    value: latest?.rt != null ? latest.rt.toFixed(2) : '—',
    detail: latest?.low != null && latest.high != null ? `95% range ${latest.low.toFixed(2)}–${latest.high.toFixed(2)} · ` : '',
    extra: trend,
    route: '/rt'
  },
  { label: 'Intervention packages', value: packages.isLoading ? '…' : `${pkgList.length}`, detail: 'Ready for scenarios', route: '/interventions' },
  {
    label: 'Runs this week',
    value: data ? `${data.counts.runsThisWeek}` : '…',
    detail: data ? `${data.counts.runsCompleted} completed · ${data.counts.runsActive} active` : '',
    route: '/simulation'
  },
  {
    label: 'Report drafts in progress',
    value: data ? `${data.counts.reportsDraft}` : '…',
    detail: data ? `${data.counts.reportsPending} waiting for approval` : '',
    route: '/reports'
  }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Good morning, {userName.split(' ')[0]}</h1>
        <p className="text-body text-text-secondary">
          Spread trend, simulation runs and report drafts. All results are scenario estimates with uncertainty ranges, not forecasts.
        </p>
      </div>

      {dash.isError &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">
          The dashboard could not be loaded. {(dash.error as Error).message}{' '}
          <button onClick={() => dash.refetch()} className="font-semibold underline">Try again</button>
        </div>
      }

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
        {rt.data && rt.data.startDate ?
        <RtTrendCard
          points={rt.data.points}
          startDate={rt.data.startDate}
          label={`${rtDataset?.name ?? rt.data.datasetId}${rt.data.illustrative ? ' (illustrative sample counts)' : ''}`}
          onOpen={() => go('/rt')} /> :


        <section className="bg-surface p-6 rounded-xl border border-border text-[13px] text-text-secondary">
            <h2 className="text-h3 text-text-primary mb-2">Rt trend</h2>
            {rt.isLoading || dash.isLoading ?
          'Loading the Rt estimate…' :
          rt.isError ?
          `The Rt estimate could not be loaded. ${(rt.error as Error).message}` :
          'No case dataset is available yet. Import daily case counts on Rt Tracking.'}
          </section>
        }

        <section className="bg-surface rounded-xl border border-border">
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h2 className="text-h3 text-text-primary">Intervention packages</h2>
            <span className="text-[12px] text-text-secondary">{pkgList.length}</span>
          </div>
          {packages.isError ?
          <p className="px-5 pb-5 text-[13px] text-danger">Packages could not be loaded.</p> :

          <ul className="divide-y divide-border border-t border-border">
              {pkgList.map((p) =>
            <li key={p.id}>
                  <button
                onClick={() => go('/interventions')}
                className="w-full text-left px-5 py-3 flex items-center gap-3 hover:bg-background transition-colors">

                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] text-text-primary truncate">{p.name}</span>
                      <span className="block text-[12px] text-text-secondary">
                        {p.items.length} interventions · updated {formatDate(p.updated)}
                      </span>
                    </span>
                    <ChevronRight size={15} className="text-text-secondary flex-shrink-0" />
                  </button>
                </li>
            )}
            </ul>
          }
        </section>
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between">
          <h2 className="text-h3 text-text-primary">Recent simulation runs</h2>
          <button onClick={() => go('/scenario')} className="text-[12px] font-semibold text-primary hover:underline flex items-center">
            Scenario Comparison <ArrowRight size={13} className="ml-1" />
          </button>
        </div>
        {data && data.recentRuns.length === 0 ?
        <p className="px-6 pb-6 text-[13px] text-text-secondary">No runs yet. Start one on the Simulations page.</p> :

        <table className="w-full text-[13px]">
            <thead className="bg-background border-y border-border">
              <tr className="text-left text-[12px] text-text-secondary">
                <th className="px-6 py-2.5 font-semibold">Scenario</th>
                <th className="px-6 py-2.5 font-semibold">Model</th>
                <th className="px-6 py-2.5 font-semibold">Started</th>
                <th className="px-6 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(data?.recentRuns ?? []).map((r) =>
            <tr
              key={r.id}
              onClick={() => r.status === 'completed' && go(`/simulation/runs/${r.id}`)}
              className={r.status === 'completed' ? 'cursor-pointer hover:bg-background' : ''}>

                  <td className="px-6 py-3">
                    <div className="text-text-primary font-medium">{r.scenarioName}</div>
                    <div className="text-[11px] text-text-secondary">{r.id} · {r.requestedBy}</div>
                  </td>
                  <td className="px-6 py-3 text-text-secondary">{r.modelType === 'seihfr_geo' ? 'District (30)' : 'National'}</td>
                  <td className="px-6 py-3 text-text-secondary whitespace-nowrap">{formatDate(r.queuedAt)}</td>
                  <td className="px-6 py-3"><ScenarioStatusBadge status={RUN_STATUS[r.status] ?? 'Saved'} /></td>
                </tr>
            )}
            </tbody>
          </table>
        }
      </section>
    </div>);

}
