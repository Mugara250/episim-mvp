import React, { useEffect, useState } from 'react';
import { AlertTriangle, Save, Lock } from 'lucide-react';
import { inputCls, labelCls } from '../models/chartTheme';
import { HospitalEntry, OfficerDisease, PpeLevel } from '../../types/officer';
import { OCCUPANCY_WARNING, formatDay } from '../../utils/hospital';

type Counts = Omit<HospitalEntry, 'id' | 'date' | 'disease'>;

const NUMBER_FIELDS: {key: keyof Counts;label: string;}[] = [
{ key: 'suspected', label: 'Suspected' },
{ key: 'confirmed', label: 'Confirmed' },
{ key: 'inIsolation', label: 'In isolation' },
{ key: 'recovered', label: 'Recovered' },
{ key: 'deaths', label: 'Deaths' },
{ key: 'hcwInfected', label: 'Health workers infected' },
{ key: 'trainedStaff', label: 'Trained staff on duty' },
{ key: 'contactsFollowUp', label: 'Contacts under follow-up' }];


const EMPTY: Counts = {
  suspected: 0, confirmed: 0, inIsolation: 0, recovered: 0, deaths: 0, hcwInfected: 0,
  bedsTotal: 24, bedsOccupied: 0, ppeStock: 'Good', trainedStaff: 0, burialTeamReady: true, contactsFollowUp: 0
};

function pick(e: HospitalEntry): Counts {
  const { id: _i, date: _d, disease: _s, ...rest } = e;
  return rest;
}

export function EntryForm({
  today,
  disease,
  onDiseaseChange,
  existing,
  previous,
  onSubmit







}: {today: string;disease: OfficerDisease;onDiseaseChange: (d: OfficerDisease) => void;existing?: HospitalEntry;previous?: HospitalEntry;onSubmit: (c: Counts) => void;}) {
  const [values, setValues] = useState<Counts>(EMPTY);

  useEffect(() => {
    if (existing) setValues(pick(existing));else
    if (previous) setValues({ ...pick(previous), suspected: 0, confirmed: 0, deaths: 0, recovered: previous.recovered, hcwInfected: previous.hcwInfected });else
    setValues(EMPTY);
  }, [existing?.id, previous?.id, disease]);

  const set = <K extends keyof Counts,>(k: K, v: Counts[K]) => setValues((p) => ({ ...p, [k]: v }));
  const occupancy = values.bedsTotal > 0 ? values.bedsOccupied / values.bedsTotal : 0;
  const overCapacity = values.bedsOccupied > values.bedsTotal;
  const invalid = overCapacity || NUMBER_FIELDS.some((f) => values[f.key] as number < 0);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!invalid) onSubmit(values);
      }}
      className="bg-surface p-6 rounded-xl border border-border space-y-5">
      
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <h2 className="text-h3 text-text-primary">{existing ? 'Edit today’s entry' : 'Today’s entry'}</h2>
          <p className="text-[12px] text-text-secondary mt-1">
            {formatDay(today)} · counts only, never names or patient details. You can edit today’s entry until the end of the day.
          </p>
        </div>
        <div className="inline-flex bg-background border border-border rounded-lg p-1" role="radiogroup" aria-label="Disease">
          {(['Ebola', 'Marburg'] as OfficerDisease[]).map((d) =>
          <button
            key={d}
            type="button"
            role="radio"
            aria-checked={disease === d}
            onClick={() => onDiseaseChange(d)}
            className={`px-4 py-1.5 rounded-md text-[13px] font-semibold transition-colors ${disease === d ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>
            
              {d}
            </button>
          )}
        </div>
      </div>

      <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <legend className="sr-only">Case and staff counts</legend>
        {NUMBER_FIELDS.map((f) =>
        <div key={f.key}>
            <label htmlFor={`he-${f.key}`} className={labelCls}>{f.label.toUpperCase()}</label>
            <input
            id={`he-${f.key}`}
            type="number"
            min={0}
            className={inputCls}
            value={values[f.key] as number}
            onChange={(e) => set(f.key, Math.max(0, Number(e.target.value)) as never)} />
          
          </div>
        )}
      </fieldset>

      <fieldset className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-5 border-t border-border">
        <legend className="sr-only">Beds and readiness</legend>
        <div>
          <label htmlFor="he-bt" className={labelCls}>ISOLATION BEDS TOTAL</label>
          <input id="he-bt" type="number" min={0} className={inputCls} value={values.bedsTotal} onChange={(e) => set('bedsTotal', Math.max(0, Number(e.target.value)))} />
        </div>
        <div>
          <label htmlFor="he-bo" className={labelCls}>ISOLATION BEDS OCCUPIED</label>
          <input
            id="he-bo"
            type="number"
            min={0}
            aria-invalid={overCapacity}
            className={`${inputCls} ${overCapacity ? 'border-danger' : ''}`}
            value={values.bedsOccupied}
            onChange={(e) => set('bedsOccupied', Math.max(0, Number(e.target.value)))} />
          
        </div>
        <div>
          <label htmlFor="he-ppe" className={labelCls}>PROTECTIVE EQUIPMENT</label>
          <select id="he-ppe" className={inputCls} value={values.ppeStock} onChange={(e) => set('ppeStock', e.target.value as PpeLevel)}>
            <option value="Good">Good (2+ weeks)</option>
            <option value="Low">Low (under 2 weeks)</option>
            <option value="Critical">Critical (under 3 days)</option>
          </select>
        </div>
        <div>
          <span className={labelCls}>SAFE-BURIAL TEAM READY</span>
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Safe-burial team ready">
            {[true, false].map((v) =>
            <button
              key={String(v)}
              type="button"
              role="radio"
              aria-checked={values.burialTeamReady === v}
              onClick={() => set('burialTeamReady', v)}
              className={`py-2 rounded-lg border text-[13px] font-semibold transition-colors ${values.burialTeamReady === v ? 'border-primary bg-hover text-primary' : 'border-border text-text-secondary hover:border-primary/40'}`}>
              
                {v ? 'Yes' : 'No'}
              </button>
            )}
          </div>
        </div>
      </fieldset>

      {overCapacity ?
      <p role="alert" className="flex items-center gap-2 text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-4 py-3">
          <AlertTriangle size={16} /> Occupied beds can’t be more than the total.
        </p> :
      occupancy > OCCUPANCY_WARNING ?
      <p role="alert" className="flex items-center gap-2 text-[13px] text-text-primary bg-warning/10 border border-warning/30 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="text-warning" />
          Isolation beds are {Math.round(occupancy * 100)}% full. Above 80% the national Epidemiologist team will be alerted.
        </p> :
      null}

      <div className="flex items-center justify-between gap-4">
        <span className="flex items-center gap-1.5 text-[12px] text-text-secondary">
          <Lock size={12} /> Earlier days are locked.
        </span>
        <button
          type="submit"
          disabled={invalid}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          
          <Save size={15} className="mr-2" /> {existing ? 'Update entry' : 'Save entry'}
        </button>
      </div>
    </form>);

}