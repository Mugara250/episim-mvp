import React from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, HelpCircle, MinusCircle, Users, LayoutGrid, XCircle } from 'lucide-react';
import { PopulationImportState } from '../../hooks/usePopulationImport';
import { ImportFormat } from '../../types/populationImport';
import { ValidationPanel } from './ValidationPanel';

const FORMAT_COPY: Record<ImportFormat, {label: string;icon: typeof Users;explain: string;}> = {
  microdata: {
    label: 'Individual-level microdata',
    icon: Users,
    explain: 'Each row describes one person. We found household and person IDs, age and sex. EpiSim can add these up into totals after the import.'
  },
  aggregate: {
    label: 'Pre-aggregated counts',
    icon: LayoutGrid,
    explain: 'Each row is a total for one region and age band. EpiSim can use these totals directly.'
  }
};

export function CheckStep({ s, readOnly }: {s: PopulationImportState;readOnly: boolean;}) {
  const fmt = s.format;
  const overridden = s.detected !== 'unknown' && fmt !== null && fmt !== s.detected;
  const columns = s.file?.columns ?? [];

  return (
    <div className="space-y-6">
      <section className="bg-surface rounded-xl border border-border p-6 grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6 items-start">
        <div>
          <p className="text-micro text-text-secondary mb-3">WHAT KIND OF FILE IS THIS?</p>
          {s.detected === 'unknown' ?
          <>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/15 text-warning text-[13px] font-semibold">
                <HelpCircle size={15} /> We couldn’t tell
              </span>
              <p className="text-[13px] text-text-secondary mt-3 max-w-xl">
                The column names don’t match the usual census layouts. Choose the format that describes your file, then match the columns below.
              </p>
            </> :

          (() => {
            const c = FORMAT_COPY[s.detected];
            const Icon = c.icon;
            return (
              <>
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-hover text-primary text-[13px] font-semibold">
                    <Icon size={15} /> {c.label}
                  </span>
                  <p className="text-[13px] text-text-secondary mt-3 max-w-xl">{c.explain}</p>
                </>);

          })()
          }
          {overridden &&
          <p className="flex items-start gap-2 text-[13px] text-warning mt-3 max-w-xl">
              <AlertTriangle size={15} className="mt-0.5 flex-shrink-0" />
              You changed this from what we detected. Check the column matches below before continuing.
            </p>
          }
        </div>
        <fieldset disabled={readOnly}>
          <legend className="text-[12px] text-text-secondary mb-2">Treat this file as</legend>
          <div className="inline-flex p-1 rounded-lg bg-background border border-border" role="radiogroup">
            {(['microdata', 'aggregate'] as ImportFormat[]).map((f) =>
            <button
              key={f}
              role="radio"
              aria-checked={fmt === f}
              onClick={() => s.chooseFormat(f)}
              className={`px-4 py-2 rounded-md text-[13px] font-semibold whitespace-nowrap transition-colors ${
              fmt === f ? 'bg-surface text-primary shadow-card' : 'text-text-secondary hover:text-text-primary'}`
              }>
              
                {f === 'microdata' ? 'Microdata' : 'Aggregate counts'}
              </button>
            )}
          </div>
        </fieldset>
      </section>

      {fmt &&
      <section className="bg-surface rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-5 border-b border-border">
            <h2 className="text-h3 text-text-primary">Match your columns</h2>
            <p className="text-[13px] text-text-secondary mt-1">
              We matched what we could. Check each row, and pick a column for anything marked required.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-background text-text-secondary text-left">
                <tr>
                  <th className="px-6 py-3 font-medium w-[34%]">Column in your file</th>
                  <th className="px-2 py-3" aria-hidden />
                  <th className="px-6 py-3 font-medium">EpiSim field</th>
                  <th className="px-6 py-3 font-medium w-[22%]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {s.fields.map((f) => {
                const col = s.mapping[f.key] ?? '';
                const dup = !!col && s.duplicateColumns.includes(col);
                const status = dup ?
                { icon: AlertTriangle, tone: 'text-warning', text: 'Column used twice' } :
                col ?
                { icon: CheckCircle2, tone: 'text-success', text: 'Matched' } :
                f.required ?
                { icon: XCircle, tone: 'text-danger', text: 'Required: choose a column' } :
                { icon: MinusCircle, tone: 'text-text-secondary', text: 'Optional, not used' };
                const Icon = status.icon;
                return (
                  <tr key={f.key}>
                      <td className="px-6 py-3">
                        <label className="sr-only" htmlFor={`map-${f.key}`}>
                          File column for {f.label}
                        </label>
                        <select
                        id={`map-${f.key}`}
                        disabled={readOnly}
                        value={col}
                        onChange={(e) => s.setMapping({ ...s.mapping, [f.key]: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg border bg-background font-mono text-[12px] text-text-primary focus:outline-none focus:border-primary ${
                        !col && f.required ? 'border-danger/50' : 'border-border'}`
                        }>
                        
                          <option value="">{f.required ? 'Choose a column…' : 'Not in this file'}</option>
                          {columns.map((c) =>
                        <option key={c} value={c}>
                              {c}
                            </option>
                        )}
                        </select>
                      </td>
                      <td className="px-2 py-3 text-text-secondary" aria-hidden>
                        <ArrowRight size={14} />
                      </td>
                      <td className="px-6 py-3">
                        <div className="font-medium text-text-primary">
                          {f.label}
                          {!f.required && <span className="text-text-secondary font-normal"> (optional)</span>}
                        </div>
                        <div className="text-[12px] text-text-secondary mt-0.5">
                          <span className="font-mono">{f.key}</span> · {f.help}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center gap-1.5 ${status.tone}`}>
                          <Icon size={15} className="flex-shrink-0" />
                          <span className="text-[12px] font-medium">{status.text}</span>
                        </span>
                      </td>
                    </tr>);

              })}
              </tbody>
            </table>
          </div>
        </section>
      }

      {fmt && <ValidationPanel s={s} />}
    </div>);

}