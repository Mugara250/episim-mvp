import { AlertTriangle, Info, ArrowRight, FileText } from 'lucide-react';
import { FanChart } from '../components/models/FanChart';
import { CHART } from '../components/models/chartTheme';
import { usePolicyDashboard, Trend } from '../api/dashboard';
import { inTen, rangeText, toDayBands, useRunResultsMany } from '../api/policy';
import { formatDate } from '../api/reports';

const TREND_WORDS: Record<Trend, string> = {
  growing: 'The outbreak is likely growing.',
  shrinking: 'The outbreak is likely slowing down.',
  uncertain: 'Too early to say if it is growing or slowing.',
  'not-enough-data': 'Not enough reports yet.'
};

const ALERT_STYLE = {
  high: { icon: AlertTriangle, tone: 'text-danger' },
  medium: { icon: AlertTriangle, tone: 'text-warning' },
  info: { icon: Info, tone: 'text-primary' }
};

const COLORS = [CHART.accent, CHART.primary];

export function PolicyDashboard({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const go = (r: string) => onNavigate?.(r);
  const dash = usePolicyDashboard();
  const data = dash.data;

  const rt = data?.rt.find((r) => r.disease === 'ebola') ?? data?.rt[0];
  const latestRt = rt?.latest ?? null;
  const withRuns = (data?.approvedScenarios ?? []).filter((s) => s.runId).slice(0, 2);
  const runIds = withRuns.map((s) => s.runId as string);
  const { results, series } = useRunResultsMany(runIds);
  const main = results[0]?.data;
  const report = data?.approvedReports[0];

  if (dash.isLoading) {
    return <p className="max-w-7xl mx-auto p-10 text-center text-[13px] text-text-secondary">Loading the overview…</p>;
  }
  if (dash.isError || !data) {
    return (
      <div className="max-w-7xl mx-auto p-10 text-center text-[13px]">
        <p className="text-danger mb-2">The overview could not be loaded. {(dash.error as Error | null)?.message}</p>
        <button onClick={() => dash.refetch()} className="text-primary font-semibold hover:underline">Try again</button>
      </div>);

  }

  const fan = withRuns.
  map((s, i) => ({ s, i, data: toDayBands(series[i]?.data?.series?.active) })).
  filter((x) => x.data.length > 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Outbreak overview</h1>
        <p className="text-body text-text-secondary">
          All numbers are ranges from many simulated runs of scenarios approved by the Epidemiologist team. They are scenario estimates, not forecasts.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">HOW FAST IT IS SPREADING</div>
          <div className="text-kpi text-text-primary">
            {latestRt?.low != null && latestRt.high != null ? `${latestRt.low.toFixed(1)} to ${latestRt.high.toFixed(1)}` : '—'}
          </div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            People infected by each sick person (current Rt). {TREND_WORDS[rt?.trend ?? 'not-enough-data']}
            {rt?.illustrative && ' Based on illustrative sample counts.'}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">POSSIBLE TOTAL CASES</div>
          <div className="text-kpi text-text-primary">{main ? rangeText(main.summary.finalCases) : '—'}</div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            {withRuns[0] ? `5–95% range for “${withRuns[0].name}”.` : 'No approved scenario has run results yet.'}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">BEDS NEEDED VS AVAILABLE</div>
          <div className={`text-kpi ${main?.capacity && main.capacity.pBedsExceeded > 0.2 ? 'text-warning' : 'text-text-primary'}`}>
            {main ? rangeText(main.summary.peakBeds) : '—'}
          </div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            Needed at the busiest point
            {main?.capacity ? ` · ${main.capacity.beds} available. Short in ${inTen(main.capacity.pBedsExceeded)} runs.` : '.'}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">CHANCE IT TAKES OFF</div>
          <div className="text-kpi text-text-primary">{main ? `${inTen(main.summary.pTakeOff)}` : '—'}</div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">Share of simulated runs that reach 20 or more cases.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <section className="bg-surface p-6 rounded-xl border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-h3 text-text-primary">Approved scenarios</h2>
              <p className="text-[12px] text-text-secondary mt-1">
                People sick at the same time. The line is the most likely path; the shaded area shows the 5–95% range of simulated runs.
              </p>
            </div>
            <button onClick={() => go('/scenario')} className="text-[12px] font-semibold text-primary hover:underline flex items-center whitespace-nowrap">
              Compare scenarios <ArrowRight size={13} className="ml-1" />
            </button>
          </div>
          {fan.length === 0 ?
          <p className="py-12 text-center text-[13px] text-text-secondary">
              No approved scenario has run results yet. Charts appear once an Epidemiologist approves a scenario with a completed run.
            </p> :

          <FanChart series={fan.map(({ s, i, data }) => ({ key: `s${i}`, label: s.name, color: COLORS[i], data }))} height={280} />
          }
        </section>

        <div className="space-y-6">
          <section className="bg-surface rounded-xl border border-border">
            <h2 className="text-h3 text-text-primary px-5 pt-5 pb-3">Alerts</h2>
            {data.alerts.length === 0 ?
            <p className="px-5 pb-5 text-[13px] text-text-secondary">No alerts.</p> :

            <ul className="divide-y divide-border border-t border-border">
                {data.alerts.map((a) => {
                const s = ALERT_STYLE[a.level] ?? ALERT_STYLE.info;
                const Icon = s.icon;
                return (
                  <li key={a.id} className="px-5 py-3 flex gap-3">
                      <Icon size={16} className={`${s.tone} mt-0.5 flex-shrink-0`} />
                      <div>
                        <p className="text-[13px] font-medium text-text-primary">{a.title}</p>
                        <p className="text-[12px] text-text-secondary mt-0.5">{a.detail}</p>
                        <p className="text-[11px] text-text-secondary mt-1">
                          {formatDate(a.date)}
                          {a.illustrative && ' · Illustrative'}
                        </p>
                      </div>
                    </li>);

              })}
              </ul>
            }
          </section>

          {report &&
          <section className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 text-micro text-text-secondary mb-2">
                <FileText size={13} /> LATEST APPROVED REPORT
              </div>
              <h2 className="text-[15px] font-semibold text-text-primary">{report.title}</h2>
              <p className="text-[12px] text-text-secondary mt-1">
                Approved {formatDate(report.approvedOn)} by {report.approvedBy ?? '—'}
                {report.illustrative && ' · Illustrative'}
              </p>
              <p className="text-[13px] text-text-secondary mt-3 line-clamp-3">{report.summary}</p>
              <button onClick={() => go(`/reports/${report.id}`)} className="mt-4 text-[13px] font-semibold text-primary hover:underline flex items-center">
                Read report <ArrowRight size={13} className="ml-1" />
              </button>
            </section>
          }
        </div>
      </div>
    </div>);

}
