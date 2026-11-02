import React, { useMemo } from 'react';
import { geoMercator, geoPath } from 'd3-geo';
import { BorderRisk, DistrictBoundaries, DistrictResult, GeoMetric, MovementLink } from '../../types/geographic';
import { fillFor, reachedOnlyInSomeRuns, valueLabel } from '../../utils/geographicSpread';

// SVG choropleth of the 30 districts drawn from the real boundary file (geoBoundaries, CC BY 4.0).
// Shapes come only from that file: if it is missing, the parent shows an error instead of this map.

interface Props {
  boundaries: DistrictBoundaries;
  districts: DistrictResult[];
  metric: GeoMetric;
  day: number;
  maxCases: number;
  seedCode: string | null;
  selectedCode: string | null;
  onSelect: (code: string) => void;
  links: MovementLink[] | null;
  borderRisks: BorderRisk[];
  svgRef: React.RefObject<SVGSVGElement>;
}

const W = 760;
const H = 560;
const PAD = { top: 52, right: 104, bottom: 52, left: 104 };
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const NAVY = '#0E1B36';
const RED = '#DC2626';
const RISK_TEXT: Record<string, string> = { High: RED, Medium: '#0F172A', Low: '#64748B' };

export function DistrictChoropleth({ boundaries, districts, metric, day, maxCases, seedCode, selectedCode, onSelect, links, borderRisks, svgRef }: Props) {
  const { path, project } = useMemo(() => {
    const projection = geoMercator().fitExtent(
      [
      [PAD.left, PAD.top],
      [W - PAD.right, H - PAD.bottom]],

      boundaries
    );
    return { path: geoPath(projection), project: (lon: number, lat: number) => projection([lon, lat]) ?? [0, 0] };
  }, [boundaries]);

  const byCode = useMemo(() => new Map(districts.map((d) => [d.code, d])), [districts]);
  const centre = useMemo(
    () => new Map(boundaries.features.map((f) => [f.properties.code, project(f.properties.cx, f.properties.cy)])),
    [boundaries, project]
  );
  const maxTrips = Math.max(1, ...(links ?? []).map((l) => l.tripsPerDay));
  const labelled = new Set([seedCode, selectedCode].filter(Boolean));

  const chipBox = (side: BorderRisk['side']) => {
    switch (side) {
      case 'west':return { x: 8, y: H / 2 - 26, w: PAD.left - 20, h: 52, stacked: true };
      case 'east':return { x: W - PAD.right + 12, y: H / 2 - 26, w: PAD.right - 20, h: 52, stacked: true };
      case 'north':return { x: W / 2 - 70, y: 10, w: 140, h: 28, stacked: false };
      default:return { x: W / 2 - 70, y: H - 38, w: 140, h: 28, stacked: false };
    }
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      role="group"
      aria-label="Map of Rwanda's 30 districts"
      style={{ fontFamily: FONT, display: 'block' }}>
      <defs>
        <pattern id="reach-hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="6" stroke="#94A3B8" strokeWidth="1.2" />
        </pattern>
      </defs>
      <rect x={0} y={0} width={W} height={H} fill="#FFFFFF" />

      {boundaries.features.map((f) => {
        const code = f.properties.code;
        const d = byCode.get(code);
        const fill = d ? fillFor(d, metric, day, maxCases) : '#F1F4F8';
        const someRuns = d ? reachedOnlyInSomeRuns(d) : false;
        const selected = code === selectedCode;
        const label = d ?
        `${f.properties.name}: ${valueLabel(d, metric, day)}${someRuns ? `; reached in ${Math.round((d.pReached ?? 0) * 100)}% of runs` : ''}` :
        `${f.properties.name}: no result`;
        return (
          <g
            key={code}
            role="button"
            tabIndex={0}
            aria-pressed={selected}
            aria-label={label}
            onClick={() => onSelect(code)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect(code);
              }
            }}
            className="cursor-pointer focus:outline-none">
            <title>{label}</title>
            <path d={path(f) ?? undefined} fill={fill} stroke="#FFFFFF" strokeWidth={1.2} />
            {someRuns && <path d={path(f) ?? undefined} fill="url(#reach-hatch)" fillOpacity={0.6} stroke="#64748B" strokeWidth={1} strokeDasharray="3 2" />}
          </g>);

      })}

      {/* Selection outline on top so it isn't hidden by neighbours */}
      {boundaries.features.
      filter((f) => f.properties.code === selectedCode).
      map((f) =>
      <path key="sel" d={path(f) ?? undefined} fill="none" stroke={NAVY} strokeWidth={2.5} pointerEvents="none" />
      )}

      {links?.map((l) => {
        const a = centre.get(l.from);
        const b = centre.get(l.to);
        if (!a || !b) return null;
        const w = 1 + 3 * (l.tripsPerDay / maxTrips);
        return (
          <g key={`${l.from}-${l.to}`} pointerEvents="none">
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={w + 2} strokeLinecap="round" />
            <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={NAVY} strokeOpacity={0.6} strokeWidth={w} strokeLinecap="round" strokeDasharray="5 3" />
            <circle cx={a[0]} cy={a[1]} r={2.5} fill={NAVY} />
            <circle cx={b[0]} cy={b[1]} r={2.5} fill={NAVY} />
          </g>);

      })}

      {/* Labels: seed district and selected district only, so small Kigali districts stay readable */}
      {boundaries.features.
      filter((f) => labelled.has(f.properties.code)).
      map((f) => {
        const [x, y] = centre.get(f.properties.code) ?? [0, 0];
        return (
          <g key={`lbl-${f.properties.code}`} pointerEvents="none">
              <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill="#FFFFFF" stroke="#FFFFFF" strokeWidth={3} strokeLinejoin="round">
                {f.properties.name}
              </text>
              <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={NAVY}>
                {f.properties.name}
                {f.properties.code === seedCode ? ' · seed' : ''}
              </text>
            </g>);

      })}

      {/* Border countries on their true sides, with the importation-risk assumption */}
      {borderRisks.map((r) => {
        const box = chipBox(r.side);
        const cx = box.x + box.w / 2;
        const cy = box.y + box.h / 2;
        return (
          <g key={r.country} aria-label={`${r.country}: ${r.risk} importation risk (assumption)`}>
            <title>{`${r.country}: ${r.risk} importation risk. ${r.note ?? 'Assumption, not calculated from data.'}`}</title>
            <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={box.stacked ? 12 : 14} fill="#FFFFFF" stroke="#CBD5E1" />
            {box.stacked ?
            <>
                <text x={cx} y={cy - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0F172A">{r.country}</text>
                <text x={cx} y={cy + 14} textAnchor="middle" fontSize={12} fontWeight={600} fill={RISK_TEXT[r.risk]}>{r.risk}</text>
              </> :

            <text x={cx} y={cy + 4} textAnchor="middle" fontSize={12}>
                <tspan fontWeight={700} fill="#0F172A">{r.country}</tspan>
                <tspan fontWeight={600} fill={RISK_TEXT[r.risk]}>{`  ${r.risk}`}</tspan>
              </text>
            }
          </g>);

      })}
    </svg>);

}
