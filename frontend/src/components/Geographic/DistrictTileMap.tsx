import React, { useEffect, useRef, useState } from 'react';
import { borderRisks, PROVINCES } from '../../data/geographic';
import { BorderCountry, DistrictProjection, GeoMetric, MovementLink, RiskLevel } from '../../types/geographic';
import { cellFor } from '../../utils/geographicSpread';

interface DistrictTileMapProps {
  projections: DistrictProjection[];
  metric: GeoMetric;
  day: number;
  maxCases: number;
  selectedId: string;
  onSelect: (id: string) => void;
  links: MovementLink[] | null;
  svgRef: React.RefObject<SVGSVGElement>;
}

const LEFT = 76;
const RIGHT = 92;
const TOP = 44;
const BOTTOM = 44;
const GAP = 8;
const ROW_H = 58;
const MIN_WIDTH = 660;
const FONT = 'ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif';
const UNDERLAY = '#F1F4F8';
const RED = '#DC2626';
const NAVY = '#0E1B36';

const RISK_TEXT: Record<RiskLevel, string> = { High: RED, Medium: '#0F172A', Low: '#64748B' };

type Box = {x: number;y: number;w: number;h: number;};

export function DistrictTileMap({ projections, metric, day, maxCases, selectedId, onSelect, links, svgRef }: DistrictTileMapProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(780);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(MIN_WIDTH, Math.floor(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cellW = (width - LEFT - RIGHT) / 8;
  const height = TOP + 6 * ROW_H + 5 * GAP + BOTTOM;
  const cellX = (col: number) => LEFT + col * cellW;
  const cellY = (row: number) => TOP + row * (ROW_H + GAP);
  const tile = (col: number, row: number): Box => ({ x: cellX(col) + GAP / 2, y: cellY(row), w: cellW - GAP, h: ROW_H });
  const center = (b: Box) => ({ x: b.x + b.w / 2, y: b.y + b.h / 2 });

  const byCell = new Map(projections.map((p) => [`${p.district.col},${p.district.row}`, p]));
  const boxes: Record<string, Box> = {};
  projections.forEach((p) => boxes[p.district.id] = tile(p.district.col, p.district.row));

  const gridMidY = TOP + (6 * ROW_H + 5 * GAP) / 2;
  const chips: {country: BorderCountry;box: Box;stacked: boolean;}[] = [
  { country: 'DRC', box: { x: 6, y: gridMidY - 26, w: LEFT - 18, h: 52 }, stacked: true },
  { country: 'Uganda', box: { x: cellX(5) - 70, y: 8, w: 140, h: 28 }, stacked: false },
  { country: 'Burundi', box: { x: cellX(3) - 70, y: height - 36, w: 140, h: 28 }, stacked: false },
  { country: 'Tanzania', box: { x: width - RIGHT + 12, y: cellY(3) + ROW_H / 2 - 26, w: RIGHT - 18, h: 52 }, stacked: true }];


  return (
    <div ref={wrapRef} className="w-full overflow-x-auto no-scrollbar">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label="Tile map of Rwanda's 30 districts, grouped by province"
        style={{ fontFamily: FONT, display: 'block' }}>
        
        <rect width={width} height={height} fill="#FFFFFF" />

        {/* Province islands: tinted underlay joined within a province, split by white gutters between provinces */}
        {projections.map((p) =>
        <rect key={`u-${p.district.id}`} x={cellX(p.district.col)} y={cellY(p.district.row) - GAP / 2} width={cellW} height={ROW_H + GAP} rx={6} fill={UNDERLAY} />
        )}
        {projections.map((p) => {
          const { col, row, province } = p.district;
          const right = byCell.get(`${col + 1},${row}`);
          const below = byCell.get(`${col},${row + 1}`);
          return (
            <g key={`s-${p.district.id}`}>
              {right && right.district.province !== province &&
              <rect x={cellX(col + 1) - GAP / 2} y={cellY(row) - GAP / 2} width={GAP} height={ROW_H + GAP} fill="#FFFFFF" />
              }
              {below && below.district.province !== province &&
              <rect x={cellX(col)} y={cellY(row + 1) - GAP} width={cellW} height={GAP} fill="#FFFFFF" />
              }
            </g>);

        })}
        {Object.values(PROVINCES).map((prov) => {
          const c = center(tile(prov.label.col, prov.label.row));
          return (
            <text key={prov.name} x={c.x} y={c.y + 4} textAnchor="middle" fontSize={12} fontWeight={600} letterSpacing="0.05em" fill="#64748B">
              {prov.name.toUpperCase()}
            </text>);

        })}

        {/* District tiles */}
        {projections.map((p) => {
          const b = boxes[p.district.id];
          const { fill, label, dark } = cellFor(p, metric, day, maxCases);
          const over = p.bedDemand[day] > p.beds;
          const selected = p.district.id === selectedId;
          const text = dark ? '#FFFFFF' : '#0F172A';
          return (
            <g
              key={p.district.id}
              role="button"
              tabIndex={0}
              aria-pressed={selected}
              aria-label={`${p.district.name}: ${label}${over ? ', over bed capacity' : ''}`}
              onClick={() => onSelect(p.district.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(p.district.id);
                }
              }}
              className="cursor-pointer focus:outline-none focus-visible:outline-2 focus-visible:outline-[#0E1B36]">
              
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={8} fill={fill} stroke={over ? RED : '#E2E8F0'} strokeWidth={over ? 2.5 : 1} />
              <text x={b.x + b.w / 2} y={b.y + 24} textAnchor="middle" fontSize={12} fontWeight={600} fill={text}>
                {p.district.name}
              </text>
              <text x={b.x + b.w / 2} y={b.y + 42} textAnchor="middle" fontSize={12} fill={text} opacity={0.8}>
                {label}
              </text>
              {selected && <rect x={b.x - 4} y={b.y - 4} width={b.w + 8} height={b.h + 8} rx={11} fill="none" stroke={NAVY} strokeWidth={2} pointerEvents="none" />}
            </g>);

        })}

        {/* Movement links */}
        {links?.map((l) => {
          const a = center(boxes[l.a]);
          const b = center(boxes[l.b]);
          return (
            <g key={`${l.a}-${l.b}`} pointerEvents="none">
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#FFFFFF" strokeOpacity={0.9} strokeWidth={3.5} strokeLinecap="round" />
              <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={NAVY} strokeOpacity={0.55} strokeWidth={1.5} strokeLinecap="round" />
              <circle cx={a.x} cy={a.y} r={2.5} fill={NAVY} fillOpacity={0.7} />
              <circle cx={b.x} cy={b.y} r={2.5} fill={NAVY} fillOpacity={0.7} />
            </g>);

        })}

        {/* Border country chips */}
        {chips.map(({ country, box, stacked }) => {
          const risk = borderRisks.find((r) => r.country === country)?.risk ?? 'Low';
          const c = center(box);
          return (
            <g key={country} aria-label={`${country}: ${risk} importation risk`}>
              <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={stacked ? 12 : 14} fill="#FFFFFF" stroke="#CBD5E1" />
              {stacked ?
              <>
                  <text x={c.x} y={c.y - 3} textAnchor="middle" fontSize={12} fontWeight={700} fill="#0F172A">{country}</text>
                  <text x={c.x} y={c.y + 14} textAnchor="middle" fontSize={12} fontWeight={600} fill={RISK_TEXT[risk]}>{risk}</text>
                </> :

              <text x={c.x} y={c.y + 4} textAnchor="middle" fontSize={12}>
                  <tspan fontWeight={700} fill="#0F172A">{country}</tspan>
                  <tspan fontWeight={600} fill={RISK_TEXT[risk]}>{`  ${risk}`}</tspan>
                </text>
              }
            </g>);

        })}
      </svg>
    </div>);

}