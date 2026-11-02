import { useEffect, useState } from 'react';
import { useGeoWhatIf } from '../../api/geographic';
import { GeoState } from '../../hooks/useGeographicSpread';
import { casesAt, fmt, pctText } from '../../utils/geographicSpread';

const PROVINCE: Record<string, string> = {
  kigali: 'Kigali City',
  northern: 'Northern Province',
  southern: 'Southern Province',
  eastern: 'Eastern Province',
  western: 'Western Province'
};

const range = (r: {low: number | null;high: number | null;} | null | undefined) =>
r && r.low !== null && r.high !== null ? `${fmt(r.low)}–${fmt(r.high)}` : null;

export function DistrictSummary({ g }: {g: GeoState;}) {
  const p = g.selected;
  const H = g.horizon;
  const whatIf = useGeoWhatIf(g.runId, g.capacityId);
  const [responseDay, setResponseDay] = useState(Math.min(20, H));

  // A new district or run invalidates the previous preview.
  useEffect(() => {
    whatIf.reset();
  }, [p?.code, g.runId, g.capacityId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!p) return null;

  const reached = (p.totalCases.median ?? 0) >= 1;
  const stats = [
  { label: 'Projected cases', value: fmt(p.totalCases.median), sub: range(p.totalCases) ? `5–95%: ${range(p.totalCases)}` : null },
  { label: 'Peak day', value: reached && p.peakDay.median !== null ? `Day ${fmt(p.peakDay.median)}` : '—', sub: reached ? range(p.peakDay) && `5–95%: day ${range(p.peakDay)}` : null },
  { label: 'Peak bed demand', value: fmt(p.peakHospitalised.median), sub: range(p.peakHospitalised) ? `5–95%: ${range(p.peakHospitalised)}` : null },
  { label: 'Beds available', value: p.beds === null ? '—' : fmt(p.beds), sub: p.beds === null ? 'Pick a capacity profile' : null }];


  const status =
  p.beds === null ?
  { text: 'No capacity profile chosen', cls: 'text-text-secondary' } :
  p.bedsRunOutDay !== null ?
  { text: `Beds run out from day ${p.bedsRunOutDay}`, cls: 'text-danger' } :
  !reached ?
  { text: `No cases at the median within ${H} days`, cls: 'text-text-secondary' } :
  { text: 'Within capacity', cls: 'text-[#047857]' };

  const w = whatIf.data;
  const bedsLine = (day: number | null | undefined) => day === null || day === undefined ? 'within capacity' : `short from day ${day}`;

  return (
    <section aria-label={`${p.name} summary`} className="rounded-2xl bg-background p-5">
      <h2 className="text-h3 text-text-primary">{p.name}</h2>
      <p className="text-[12px] text-text-secondary">
        {p.province ? PROVINCE[p.province] ?? p.province : ''}
        {p.population ? ` · ${fmt(p.population)} people` : ''}
      </p>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 mt-4">
        {stats.map((s) =>
        <div key={s.label}>
            <dt className="text-[12px] text-text-secondary">{s.label}</dt>
            <dd className="text-[22px] font-bold text-text-primary tabular-nums leading-tight mt-0.5">{s.value}</dd>
            {s.sub && <dd className="text-[11px] text-text-secondary tabular-nums">{s.sub}</dd>}
          </div>
        )}
      </dl>

      <p className={`mt-4 text-[14px] font-semibold ${status.cls}`}>{status.text}</p>
      <p className="text-[12px] text-text-secondary mt-1">
        Reached in {pctText(p.pReached)} of runs
        {p.firstCaseDay.median !== null ? ` · first case around day ${fmt(p.firstCaseDay.median)} (median)` : ''}
        {` · day ${g.day}: ${fmt(casesAt(p, g.day))} cases so far (median)`}
        {p.pBedsExceeded !== null ? ` · beds run out in ${pctText(p.pBedsExceeded)} of runs` : ''}
      </p>

      <div className="mt-5 pt-5 border-t border-border">
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor="geo-response" className="text-[14px] font-medium text-text-primary">Start response on day</label>
          <span className="text-[14px] font-semibold text-text-primary tabular-nums">Day {responseDay}</span>
        </div>
        <input
          id="geo-response"
          type="range"
          min={0}
          max={H}
          value={responseDay}
          onChange={(e) => {
            setResponseDay(Number(e.target.value));
            whatIf.reset();
          }}
          className="w-full mt-2 accent-[#12A594] cursor-pointer" />
        <div className="flex items-center justify-between gap-3 mt-2">
          <p className="text-[12px] text-text-secondary">
            Re-runs the model with a full response in {p.name} only from that day. Spread to other districts still follows the estimated movement.
          </p>
          <button
            onClick={() => whatIf.mutate({ districtCode: p.code, responseStartDay: responseDay })}
            disabled={whatIf.isPending}
            className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-colors disabled:opacity-60">
            {whatIf.isPending ? 'Running…' : 'Preview'}
          </button>
        </div>
        {whatIf.isError && <p className="text-[13px] text-danger mt-2">{(whatIf.error as Error).message}</p>}
        {w &&
        <div className="mt-3 rounded-xl border border-border bg-surface p-3 text-[13px]">
            <p className="text-[11px] font-bold text-text-secondary uppercase tracking-wide mb-1">
              Preview · {w.runs} runs · response from day {w.responseStartDay}
            </p>
            <p className="text-text-primary">
              Cases in {p.name}: <span className="tabular-nums">{fmt(w.before.totalCases?.median)}</span> →{' '}
              <span className="font-semibold tabular-nums">{fmt(w.after.totalCases?.median)}</span> (median)
            </p>
            {w.before.beds !== null &&
          <p className="text-text-primary">
                Beds: {bedsLine(w.before.bedsRunOutDay)} → <span className="font-semibold">{bedsLine(w.after.bedsRunOutDay)}</span>
              </p>
          }
            <p className="text-text-secondary text-[12px]">
              National cases: {fmt(w.nationalBefore.finalCases?.median)} → {fmt(w.nationalAfter.finalCases?.median)} (median). Response
              strength values are placeholders; a preview uses fewer runs than the full result.
            </p>
          </div>
        }
      </div>
    </section>);

}
