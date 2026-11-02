import { DistrictProjection, GeoScenario } from '../types/geographic';
import { downloadCsv } from './csv';
import { riskOf } from './geographicSpread';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function exportMapPng(svg: SVGSVGElement | null, scenario: GeoScenario, day: number) {
  if (!svg) return;
  const w = svg.width.baseVal.value;
  const h = svg.height.baseVal.value;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * 2;
    canvas.height = h * 2;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${slug(scenario.name)}-map-day-${day}.png`;
    a.click();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
}

export function exportDistrictCsv(projections: DistrictProjection[], scenario: GeoScenario) {
  downloadCsv(
    `${slug(scenario.name)}-districts.csv`,
    ['District', 'Province', 'Risk', 'Arrival day', 'Projected cases', 'Peak day', 'Peak bed demand', 'Beds available', 'Over capacity from day'],
    projections.map((p) => [
    p.district.name,
    p.district.province,
    riskOf(p, scenario.seedDistrictId),
    p.arrival ?? '',
    Math.round(p.totalCases),
    p.arrival === null ? '' : p.peakDay,
    Math.round(p.peakBedDemand),
    p.beds,
    p.overCapacityDay ?? '']
    )
  );
}