import { GeoResults } from '../types/geographic';
import { downloadCsv } from './csv';

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export function exportMapPng(svg: SVGSVGElement | null, name: string, day: number) {
  if (!svg) return;
  const vb = svg.viewBox.baseVal;
  const w = vb?.width || svg.clientWidth;
  const h = vb?.height || svg.clientHeight;
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('width', String(w));
  clone.setAttribute('height', String(h));
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
    ctx.fillStyle = '#64748B';
    ctx.font = '10px sans-serif';
    ctx.fillText(`Scenario estimates, not forecasts · Day ${day} · District boundaries: geoBoundaries, CC BY 4.0`, 8, h - 6);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${slug(name)}-map-day-${day}.png`;
    a.click();
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
}

export function exportDistrictCsv(g: GeoResults, name: string) {
  const r = (v: number | null | undefined) => v === null || v === undefined ? '' : Math.round(v);
  downloadCsv(
    `${slug(name)}-districts.csv`,
    [
    'District code', 'District', 'Province', 'Chance reached', 'First case day (median)',
    'Cases (median)', 'Cases (5%)', 'Cases (95%)', 'Peak day (median)',
    'Peak bed demand (median)', 'Peak bed demand (95%)', 'Beds available', 'Beds run out from day',
    'Chance beds run out', 'Note'],

    g.districts.map((d) => [
    d.code, d.name, d.province ?? '', d.pReached ?? '', r(d.firstCaseDay.median),
    r(d.totalCases.median), r(d.totalCases.low), r(d.totalCases.high), r(d.peakDay.median),
    r(d.peakHospitalised.median), r(d.peakHospitalised.high), r(d.beds), d.bedsRunOutDay ?? '',
    d.pBedsExceeded ?? '', 'Scenario estimate, not a forecast. Movement between districts is estimated.']
    )
  );
}
