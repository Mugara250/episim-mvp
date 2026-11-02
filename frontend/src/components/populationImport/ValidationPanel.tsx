import { AlertTriangle, CheckCircle2, Download, Info, XCircle } from 'lucide-react';
import { PopulationImportState } from '../../hooks/usePopulationImport';
import { downloadCsv } from '../../utils/csv';
import { formatCount } from '../../utils/populationImport';

export function ValidationPanel({ s }: {s: PopulationImportState;}) {
  const v = s.validation;

  if (!v && s.checkError && !s.missingRequired.length) {
    return (
      <section role="alert" className="bg-danger/10 border border-danger/30 rounded-xl p-8 text-center">
        <p className="text-h3 text-text-primary">The rows couldn’t be checked</p>
        <p className="text-[13px] text-text-secondary mt-1">{s.checkError}</p>
      </section>);

  }

  if (!v && s.checking) {
    return (
      <section className="bg-surface rounded-xl border border-border p-8 text-center" aria-live="polite">
        <p className="text-h3 text-text-primary">Checking every row…</p>
        <p className="text-[13px] text-text-secondary mt-1">The server applies the same checks the import uses.</p>
      </section>);

  }

  if (!v) {
    return (
      <section className="bg-surface rounded-xl border border-border p-8 text-center">
        <p className="text-h3 text-text-primary">Rows will be checked once the columns are matched</p>
        <p className="text-[13px] text-text-secondary mt-1">
          Still needed: {s.missingRequired.map((f) => f.label).join(', ')}.
        </p>
      </section>);

  }

  const labelOf = (key: string) => s.fields.find((f) => f.key === key)?.label ?? key;
  const previewIssues = v.preview.flatMap((r) => r.issues.map((i) => ({ line: r.line, ...i })));

  const downloadReport = () =>
  downloadCsv(
    `${(s.file?.name ?? 'import').replace(/\.csv$/i, '')}_error_report.csv`,
    ['Row in file', 'Level', 'Field', 'Value', 'Problem'],
    v.flagged.flatMap((r) => r.issues.map((i) => [r.line, i.level, labelOf(i.field), r.values[i.field] ?? '', i.message]))
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-h3 text-text-primary">Row check</h2>
          <p className="text-[13px] text-text-secondary mt-1">
            {v.partial ?
            `Based on the first ${formatCount(v.checkedRows)} rows. The rest are checked during the import.` :
            `All ${formatCount(v.checkedRows)} rows were checked.`}
          </p>
        </div>
        <button
          onClick={downloadReport}
          disabled={!v.flagged.length}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-border bg-surface text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed self-start md:self-auto">
          
          <Download size={15} /> Download error report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr] gap-4">
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-micro text-text-secondary mb-2">
            <CheckCircle2 size={14} className="text-success" /> READY TO IMPORT
          </div>
          <div className="text-kpi text-text-primary tabular-nums">{formatCount(v.validRows)}</div>
          <p className="text-[12px] text-text-secondary mt-1">
            {v.partial ? 'of the rows checked' : `of ${formatCount(v.totalRows)} rows`}
            {v.warningRows > 0 && `, including ${formatCount(v.warningRows)} with warnings`}
          </p>
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-micro text-text-secondary mb-2">
            <XCircle size={14} className="text-danger" /> ROWS WITH ERRORS
          </div>
          <div className={`text-[24px] font-bold tabular-nums ${v.errorRows ? 'text-danger' : 'text-text-primary'}`}>
            {formatCount(v.errorRows)}
          </div>
          {v.breakdown.length > 0 ?
          <ul className="mt-2 space-y-1">
              {v.breakdown.map((b) =>
            <li key={b.kind} className="flex justify-between text-[12px] text-text-secondary">
                  <span>{b.kind}</span>
                  <span className="tabular-nums">{formatCount(b.count)}</span>
                </li>
            )}
            </ul> :

          <p className="text-[12px] text-text-secondary mt-1">No errors found</p>
          }
        </div>
        <div className="bg-surface rounded-xl border border-border p-5">
          <div className="flex items-center gap-2 text-micro text-text-secondary mb-2">
            <AlertTriangle size={14} className="text-warning" /> WARNINGS
          </div>
          <div className={`text-[24px] font-bold tabular-nums ${v.warningRows ? 'text-warning' : 'text-text-primary'}`}>
            {formatCount(v.warningRows)}
          </div>
          <p className="text-[12px] text-text-secondary mt-1">Imported as they are. Worth a quick look.</p>
        </div>
      </div>

      {v.errorRows > 0 &&
      <p className="flex items-start gap-2 text-[13px] text-text-secondary">
          <Info size={15} className="text-primary mt-0.5 flex-shrink-0" />
          Rows with errors are left out of the import. Fix them in your file and upload it again, or continue without them.
        </p>
      }

      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-[14px] font-semibold text-text-primary">First rows of your file</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead className="bg-background text-text-secondary text-left">
              <tr>
                <th className="px-4 py-2.5 font-medium">Row</th>
                {s.fields.map((f) =>
                <th key={f.key} className="px-4 py-2.5 font-medium whitespace-nowrap">
                    {f.label}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {v.preview.map((r) =>
              <tr key={r.line}>
                  <td className="px-4 py-2.5 text-text-secondary tabular-nums">{r.line}</td>
                  {s.fields.map((f) => {
                  const issue = r.issues.find((i) => i.field === f.key && i.level === 'error') ?? r.issues.find((i) => i.field === f.key);
                  const tone = issue ?
                  issue.level === 'error' ?
                  'bg-danger/15 text-danger font-semibold' :
                  'bg-warning/15 text-warning font-semibold' :
                  'text-text-primary';
                  return (
                    <td key={f.key} className="px-1 py-1">
                        <span title={issue?.message} className={`block px-3 py-1.5 rounded-md font-mono whitespace-nowrap ${tone}`}>
                          {r.values[f.key] || (issue ? 'empty' : '—')}
                        </span>
                      </td>);

                })}
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {previewIssues.length > 0 &&
        <ul className="px-6 py-4 border-t border-border space-y-1.5" aria-label="Problems in these rows">
            {previewIssues.map((i, idx) =>
          <li key={idx} className="flex items-start gap-2 text-[12px]">
                {i.level === 'error' ?
            <XCircle size={13} className="text-danger mt-0.5 flex-shrink-0" /> :

            <AlertTriangle size={13} className="text-warning mt-0.5 flex-shrink-0" />
            }
                <span className="text-text-secondary">
                  <span className="text-text-primary font-medium">Row {i.line}, {labelOf(i.field)}:</span> {i.message}
                </span>
              </li>
          )}
          </ul>
        }
      </div>
    </section>);

}