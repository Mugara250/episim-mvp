// Builds a simple text PDF (A4, Helvetica) without any extra library.

interface PdfLine {
  text: string;
  size: number;
}

const PAGE_LINES = 50;

function sanitize(s: string) {
  return s.
  replace(/[–—]/g, '-').
  replace(/[’‘]/g, "'").
  replace(/[“”]/g, '"').
  replace(/[·•]/g, '-').
  replace(/×/g, 'x').
  replace(/[^\x20-\x7E]/g, '');
}

function escape(s: string) {
  return s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function wrap(text: string, max: number) {
  const words = sanitize(text).split(/\s+/);
  const out: string[] = [];
  let line = '';
  words.forEach((w) => {
    if ((line + ' ' + w).trim().length > max) {
      if (line) out.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  });
  if (line) out.push(line);
  return out.length ? out : [''];
}

export function downloadPdf(filename: string, title: string, body: string[]) {
  const lines: PdfLine[] = [
  ...wrap(title, 60).map((t) => ({ text: t, size: 16 })),
  { text: '', size: 11 },
  ...body.flatMap((b) => wrap(b, 92).map((t) => ({ text: t, size: 11 })))];


  const objects: string[] = ['<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'];
  const pageIds: number[] = [];

  for (let i = 0; i < lines.length; i += PAGE_LINES) {
    const chunk = lines.slice(i, i + PAGE_LINES);
    const stream = [
    'BT',
    '15 TL',
    '56 786 Td',
    ...chunk.map((l) => `/F1 ${l.size} Tf (${escape(l.text)}) Tj T*`),
    'ET'].
    join('\n');
    objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    const contentId = objects.length;
    objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
    pageIds.push(objects.length);
  }
  objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((o, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;

  const url = URL.createObjectURL(new Blob([pdf], { type: 'application/pdf' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}