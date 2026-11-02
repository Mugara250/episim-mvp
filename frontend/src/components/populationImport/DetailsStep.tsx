import React from 'react';
import { GitBranch, Lock } from 'lucide-react';
import { DISTRICTS, PROVINCES, SECTORS, SOURCES } from '../../data/populationImport';
import { PopulationImportState } from '../../hooks/usePopulationImport';

const inputCls =
'w-full px-3 py-2.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary disabled:opacity-60';
const labelCls = 'block text-[13px] font-medium text-text-primary mb-1.5';
const helpCls = 'text-[12px] text-text-secondary mt-1.5';

export function DetailsStep({ s, readOnly }: {s: PopulationImportState;readOnly: boolean;}) {
  const d = s.details;
  const set = (patch: Partial<typeof d>) => s.setDetails({ ...d, ...patch });
  const districts = d.provinceCode ? DISTRICTS[d.provinceCode] ?? [] : [];
  const sectors = d.districtCode ? SECTORS[d.districtCode] : undefined;
  const err = s.detailErrors;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 items-start">
      <fieldset disabled={readOnly} className="bg-surface rounded-xl border border-border p-6 space-y-6">
        <legend className="sr-only">Dataset details</legend>
        <div>
          <label htmlFor="ds-name" className={labelCls}>Dataset name</label>
          <input
            id="ds-name"
            className={inputCls}
            value={d.name}
            onChange={(e) => set({ name: e.target.value })}
            placeholder="e.g. RPHC5 2022 (10% sample)"
            aria-invalid={!!err.name} />
          
          {err.name ? <p className="text-[12px] text-danger mt-1.5">{err.name}</p> : <p className={helpCls}>This is how the dataset appears when building scenarios.</p>}
        </div>

        <div>
          <span className={labelCls}>Region covered</span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label htmlFor="ds-prov" className="sr-only">Province</label>
              <select
                id="ds-prov"
                className={inputCls}
                value={d.provinceCode}
                onChange={(e) => set({ provinceCode: e.target.value, districtCode: '', sectorCode: '' })}>
                
                <option value="">All of Rwanda</option>
                {PROVINCES.map((p) =>
                <option key={p.code} value={p.code}>
                    {p.code} · {p.name}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="ds-dist" className="sr-only">District</label>
              <select
                id="ds-dist"
                className={inputCls}
                value={d.districtCode}
                disabled={!d.provinceCode}
                onChange={(e) => set({ districtCode: e.target.value, sectorCode: '' })}>
                
                <option value="">{d.provinceCode ? 'All districts' : 'District'}</option>
                {districts.map((x) =>
                <option key={x.code} value={x.code}>
                    {x.code} · {x.name}
                  </option>
                )}
              </select>
            </div>
            <div>
              <label htmlFor="ds-sect" className="sr-only">Sector</label>
              <select
                id="ds-sect"
                className={inputCls}
                value={d.sectorCode}
                disabled={!sectors}
                onChange={(e) => set({ sectorCode: e.target.value })}>
                
                <option value="">{d.districtCode ? 'All sectors' : 'Sector'}</option>
                {(sectors ?? []).map((x) =>
                <option key={x.code} value={x.code}>
                    {x.code} · {x.name}
                  </option>
                )}
              </select>
            </div>
          </div>
          <p className={helpCls}>
            {d.districtCode && !sectors ?
            'Sector codes for this district aren’t loaded yet, so the dataset will cover the whole district.' :
            'Pick the smallest area the file covers. The numbers are the NISR region codes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="ds-year" className={labelCls}>Year</label>
            <input
              id="ds-year"
              inputMode="numeric"
              maxLength={4}
              className={inputCls}
              value={d.year}
              onChange={(e) => set({ year: e.target.value.replace(/\D/g, '') })}
              placeholder="2022"
              aria-invalid={!!err.year} />
            
            {err.year ? <p className="text-[12px] text-danger mt-1.5">{err.year}</p> : <p className={helpCls}>The year the data was collected.</p>}
          </div>
          <div>
            <label htmlFor="ds-source" className={labelCls}>Source</label>
            <select id="ds-source" className={inputCls} value={d.source} onChange={(e) => set({ source: e.target.value })}>
              {SOURCES.map((x) =>
              <option key={x}>{x}</option>
              )}
            </select>
            {err.source && <p className="text-[12px] text-danger mt-1.5">{err.source}</p>}
          </div>
        </div>

        <div>
          <span className={labelCls}>Granularity</span>
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-surface-2 text-[13px] text-text-primary">
            <Lock size={13} className="text-text-secondary" />
            {s.format === 'aggregate' ? 'Aggregate counts' : 'Microdata (one row per person)'}
          </div>
          <p className={helpCls}>Set from the Check step. Go back to change it.</p>
        </div>
      </fieldset>

      <aside className="bg-surface rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 text-micro text-text-secondary mb-3">
          <GitBranch size={14} /> VERSION
        </div>
        <p className="text-[24px] font-bold text-text-primary">Version {s.version}</p>
        {s.existing ?
        <>
            <p className="text-[13px] text-text-primary mt-2">“{s.existing.name}” already exists, so this will create version {s.version}.</p>
            <p className="text-[13px] text-text-secondary mt-2">
              The {s.existing.scenariosUsing} scenarios built on version {s.existing.latestVersion} keep using it, so their results won’t change. New scenarios
              will use version {s.version}.
            </p>
          </> :

        <p className="text-[13px] text-text-secondary mt-2">This is a new dataset. If you import an updated file with the same name later, it becomes version 2.</p>
        }
      </aside>
    </div>);

}