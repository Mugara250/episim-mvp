import React, { useMemo } from 'react';
import { AlertTriangle, Info, ArrowRight, FileText } from 'lucide-react';
import { FanChart } from '../components/models/FanChart';
import { CHART } from '../components/models/chartTheme';
import { caseSeries } from '../data/caseReports';
import { policyAlerts } from '../data/policyAlerts';
import { approvedReports } from '../data/approvedReports';
import { getDisease } from '../lib/models/diseases';
import { estimateRt, trendOf } from '../lib/models/rt';
import { bedsRange, casesRange, inTen, resultFor, scenarioById } from '../utils/approvedScenarioResults';

const TREND_WORDS = {
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

export function PolicyDashboard({ onNavigate }: {onNavigate?: (route: string) => void;}) {
  const go = (r: string) => onNavigate?.(r);
  const series = caseSeries.find((s) => s.diseaseId === 'ebola') ?? caseSeries[0];
  const latestRt = useMemo(() => {
    const pts = estimateRt(series.counts, getDisease(series.diseaseId).serialInterval, 7);
    return [...pts].reverse().find((p) => p.rt !== null);
  }, [series.id]);

  const current = scenarioById('APS-01')!;
  const fast = scenarioById('APS-02')!;
  const slow = scenarioById('APS-03')!;
  const full = scenarioById('APS-04')!;
  const res = useMemo(
    () => ({ current: resultFor(current), fast: resultFor(fast), slow: resultFor(slow), full: resultFor(full) }),
    []
  );
  const delayDrop = 1 - res.fast.finalCases.median / Math.max(1, res.slow.finalCases.median);
  const report = approvedReports[0];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Outbreak overview</h1>
        <p className="text-body text-text-secondary">
          Ebola in Rubavu district. All numbers are ranges from many simulated scenarios, approved by the Epidemiologist team. They are estimates, not exact predictions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">HOW FAST IT IS SPREADING</div>
          <div className="text-kpi text-text-primary">
            {latestRt?.low != null ? `${latestRt.low.toFixed(1)} to ${latestRt.high?.toFixed(1)}` : '—'}
          </div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            People infected by each sick person (current Rt). {TREND_WORDS[trendOf(latestRt)]}
          </p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">POSSIBLE TOTAL CASES</div>
          <div className="text-kpi text-text-primary">{casesRange(res.current)}</div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">Over the next six months if the current response continues.</p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">BEDS NEEDED VS AVAILABLE</div>
          <div className={`text-kpi ${res.current.pBedsExceeded > 0.2 ? 'text-warning' : 'text-text-primary'}`}>
            {bedsRange(res.current)}
          </div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            Needed at the busiest point · {current.isolationBeds} available. Short in {inTen(res.current.pBedsExceeded)} runs.
          </p>
        </div>
        <div className="bg-surface p-5 rounded-xl border border-border flex flex-col">
          <div className="text-micro text-text-secondary mb-2">EFFECT OF RESPONSE DELAY</div>
          <div className="text-kpi text-text-primary">
            {delayDrop > 0 ? `About ${Math.round(delayDrop * 100)}% fewer` : 'Little change'}
          </div>
          <p className="text-[12px] text-text-secondary mt-auto pt-1">
            Cases when sick people are isolated within 3 days instead of 7 ({casesRange(res.fast)} vs {casesRange(res.slow)}).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
        <section className="bg-surface p-6 rounded-xl border border-border">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-h3 text-text-primary">Current response vs full package</h2>
              <p className="text-[12px] text-text-secondary mt-1">
                People sick at the same time. The line is the most likely path; the shaded area shows the range of possible outcomes.
              </p>
            </div>
            <button onClick={() => go('/scenario')} className="text-[12px] font-semibold text-primary hover:underline flex items-center whitespace-nowrap">
              Compare scenarios <ArrowRight size={13} className="ml-1" />
            </button>
          </div>
          <FanChart
            series={[
            { key: 'cur', label: 'Current response', color: CHART.accent, data: res.current.active },
            { key: 'full', label: 'Full package', color: CHART.primary, data: res.full.active }]
            }
            height={280} />
          
        </section>

        <div className="space-y-6">
          <section className="bg-surface rounded-xl border border-border">
            <h2 className="text-h3 text-text-primary px-5 pt-5 pb-3">Alerts</h2>
            <ul className="divide-y divide-border border-t border-border">
              {policyAlerts.map((a) => {
                const s = ALERT_STYLE[a.level];
                const Icon = s.icon;
                return (
                  <li key={a.id} className="px-5 py-3 flex gap-3">
                    <Icon size={16} className={`${s.tone} mt-0.5 flex-shrink-0`} />
                    <div>
                      <p className="text-[13px] font-medium text-text-primary">{a.title}</p>
                      <p className="text-[12px] text-text-secondary mt-0.5">{a.detail}</p>
                      <p className="text-[11px] text-text-secondary mt-1">{a.date}</p>
                    </div>
                  </li>);

              })}
            </ul>
          </section>

          {report &&
          <section className="bg-surface rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 text-micro text-text-secondary mb-2">
                <FileText size={13} /> LATEST APPROVED REPORT
              </div>
              <h2 className="text-[15px] font-semibold text-text-primary">{report.title}</h2>
              <p className="text-[12px] text-text-secondary mt-1">Approved {report.approvedOn} by {report.approvedBy}</p>
              <p className="text-[13px] text-text-secondary mt-3 line-clamp-3">{report.summary}</p>
              <button onClick={() => go('/reports')} className="mt-4 text-[13px] font-semibold text-primary hover:underline flex items-center">
                Read report <ArrowRight size={13} className="ml-1" />
              </button>
            </section>
          }
        </div>
      </div>
    </div>);

}