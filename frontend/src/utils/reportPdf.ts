import { ApprovedReport } from '../types/policy';
import { downloadPdf } from './pdf';

export function downloadReportPdf(r: ApprovedReport) {
  downloadPdf(`${r.id}.pdf`, r.title, [
  `${r.disease} - ${r.type}`,
  `Approved by ${r.approvedBy} on ${r.approvedOn}. Prepared by ${r.author}.`,
  '',
  'Summary',
  r.summary,
  '',
  'Key points',
  ...r.keyPoints.map((p) => `- ${p}`),
  '',
  'Key figures (ranges)',
  ...r.figures.map((f) => `- ${f.label}: ${f.range}`),
  '',
  'Recommendations',
  ...r.recommendations.map((p) => `- ${p}`),
  '',
  'These figures are estimates from many simulated scenarios, not exact predictions.']
  );
}