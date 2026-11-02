import { useRef, useState } from 'react';
import { CheckCircle2, Pencil, Lock } from 'lucide-react';
import { useOfficer } from '../context/OfficerContext';
import { EntryForm } from '../components/officer/EntryForm';
import { IllustrativeBadge, QueryState } from '../components/officer/DataState';
import { HospitalEntry, OfficerDisease } from '../types/officer';
import { formatDay, latestFor, OCCUPANCY_WARNING } from '../utils/hospital';

type Filter = 'All' | OfficerDisease;

export function HospitalTracker() {
  const { hospital, entries, saveEntry, isLoading, error } = useOfficer();
  const [disease, setDisease] = useState<OfficerDisease>('Ebola');
  const [filter, setFilter] = useState<Filter>('All');
  const [notice, setNotice] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const today = hospital?.today ?? new Date().toISOString().slice(0, 10);

  const existing = entries.find((e) => e.date === today && e.disease === disease);
  const previous = latestFor(entries.filter((e) => e.date < today), disease);
  const rows = [...entries].
  filter((e) => filter === 'All' || e.disease === filter).
  sort((a, b) => b.date.localeCompare(a.date) || a.disease.localeCompare(b.disease));

  const submit = async (c: Omit<HospitalEntry, 'id' | 'date' | 'disease'>) => {
    const { illustrative: _ignored, ...counts } = c;
    setSaveError(null);
    try {
      // The server keeps one entry per day and disease, so saving again replaces today's entry.
      await saveEntry(today, disease, counts);
      setNotice(`Today’s ${disease} entry ${existing ? 'updated' : 'saved'}.`);
    } catch (e) {
      setNotice(null);
      setSaveError(e instanceof Error ? e.message : 'The entry could not be saved.');
    }
  };
  const anyIllustrative = entries.some((e) => e.illustrative);

  const edit = (e: HospitalEntry) => {
    setDisease(e.disease);
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <h1 className="text-h1 text-text-primary mb-1">Hospital Tracker</h1>
        <p className="text-body text-text-secondary">
          Daily counts for {hospital?.name ?? 'your hospital'}. These feed Rt tracking and the Epidemiologists’ scenarios.
        </p>
        {anyIllustrative &&
        <p className="mt-2 flex items-center gap-2 text-[12px] text-text-secondary">
            <IllustrativeBadge /> Earlier rows are seeded sample counts for the demo, not real hospital data.
          </p>
        }
      </div>

      {saveError &&
      <div role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{saveError}</div>
      }

      <QueryState isLoading={isLoading} error={error}>

      {notice &&
      <div role="status" className="flex items-center gap-2 text-[13px] text-success bg-success/10 border border-success/20 rounded-xl px-4 py-3">
          <CheckCircle2 size={16} /> <span className="flex-1">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-[12px] text-text-secondary hover:text-text-primary">Dismiss</button>
        </div>
      }

      <div ref={formRef}>
        <EntryForm
          today={today}
          disease={disease}
          onDiseaseChange={(d) => {
            setDisease(d);
            setNotice(null);
          }}
          existing={existing}
          previous={previous}
          onSubmit={submit} />
        
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="px-6 pt-5 pb-4 flex items-center justify-between gap-4">
          <h2 className="text-h3 text-text-primary">History</h2>
          <label className="flex items-center gap-2 text-[12px] text-text-secondary">
            Disease
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-[13px] text-text-primary focus:outline-none focus:border-primary">
              
              <option>All</option>
              <option>Ebola</option>
              <option>Marburg</option>
            </select>
          </label>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px] whitespace-nowrap">
            <thead className="bg-background border-y border-border">
              <tr className="text-left text-[12px] text-text-secondary">
                <th className="px-4 py-2.5 font-semibold">Date</th>
                <th className="px-4 py-2.5 font-semibold">Disease</th>
                <th className="px-4 py-2.5 font-semibold text-right">Susp.</th>
                <th className="px-4 py-2.5 font-semibold text-right">Conf.</th>
                <th className="px-4 py-2.5 font-semibold text-right">Isolation</th>
                <th className="px-4 py-2.5 font-semibold text-right">Recov.</th>
                <th className="px-4 py-2.5 font-semibold text-right">Deaths</th>
                <th className="px-4 py-2.5 font-semibold text-right">HW inf.</th>
                <th className="px-4 py-2.5 font-semibold text-right">Beds</th>
                <th className="px-4 py-2.5 font-semibold">PPE</th>
                <th className="px-4 py-2.5 font-semibold text-right">Staff</th>
                <th className="px-4 py-2.5 font-semibold">Burial team</th>
                <th className="px-4 py-2.5 font-semibold text-right">Contacts</th>
                <th className="px-4 py-2.5" aria-label="Actions" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 &&
              <tr>
                  <td colSpan={14} className="px-4 py-8 text-center text-text-secondary">No entries yet.</td>
                </tr>
              }
              {rows.map((e) => {
                const occ = e.bedsTotal ? e.bedsOccupied / e.bedsTotal : 0;
                const isToday = e.date === today;
                return (
                  <tr key={e.id} className={isToday ? 'bg-hover/40' : undefined}>
                    <td className="px-4 py-2.5 text-text-primary">{formatDay(e.date)}{isToday && <span className="ml-1.5 text-[11px] text-primary font-semibold">Today</span>}</td>
                    <td className="px-4 py-2.5 text-text-secondary">{e.disease}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.suspected}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.confirmed}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.inIsolation}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.recovered}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.deaths}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.hcwInfected}</td>
                    <td className={`px-4 py-2.5 text-right tabular-nums font-semibold ${occ > OCCUPANCY_WARNING ? 'text-warning' : 'text-text-primary'}`}>
                      {e.bedsOccupied}/{e.bedsTotal}
                    </td>
                    <td className={`px-4 py-2.5 ${e.ppeStock === 'Critical' ? 'text-danger' : e.ppeStock === 'Low' ? 'text-warning' : 'text-text-secondary'}`}>{e.ppeStock}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.trainedStaff}</td>
                    <td className={`px-4 py-2.5 ${e.burialTeamReady ? 'text-text-secondary' : 'text-danger'}`}>{e.burialTeamReady ? 'Ready' : 'Not ready'}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums">{e.contactsFollowUp}</td>
                    <td className="px-4 py-2.5 text-right">
                      {isToday ?
                      <button onClick={() => edit(e)} className="text-[12px] font-semibold text-primary hover:underline inline-flex items-center">
                          <Pencil size={12} className="mr-1" /> Edit
                        </button> :

                      <Lock size={13} className="text-text-secondary inline" aria-label="Locked" />
                      }
                    </td>
                  </tr>);

              })}
            </tbody>
          </table>
        </div>
      </section>
      </QueryState>
    </div>);

}