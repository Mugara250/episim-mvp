import { FormEvent, useState } from 'react';
import { X } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { useDistrictNames } from '../../api/admin';
import { Hospital } from '../../types/admin';

const inputCls =
'w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary';
const labelCls = 'block text-[12px] font-medium text-text-secondary mb-1';

export function HospitalFormModal({ hospital, onClose }: {hospital: Hospital | null;onClose: () => void;}) {
  const { users, saveHospital, officersAt, hospitalName, saving } = useAdmin();
  const districtsQ = useDistrictNames();
  const districts = districtsQ.data ?? [];
  const [serverError, setServerError] = useState<string | null>(null);
  const current = hospital ? officersAt(hospital.id)[0] : undefined;
  const [name, setName] = useState(hospital?.name ?? '');
  const [district, setDistrict] = useState(hospital?.district ?? '');
  const [beds, setBeds] = useState(String(hospital?.isolationBeds ?? ''));
  const [officerId, setOfficerId] = useState(current?.id ?? '');
  const [tried, setTried] = useState(false);

  const officers = users.filter((u) => u.role === 'officer' && u.status !== 'Inactive');
  const bedsNum = Number(beds);
  const errors = {
    name: !name.trim() ? 'Enter the hospital name.' : '',
    district: !district ? 'Choose a district.' : '',
    beds: beds === '' || !Number.isInteger(bedsNum) || bedsNum < 0 ? 'Enter a whole number of beds.' : ''
  };
  const valid = !errors.name && !errors.district && !errors.beds;
  const movingOfficer = officers.find((o) => o.id === officerId && o.hospitalId && o.hospitalId !== hospital?.id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    setServerError(null);
    try {
      await saveHospital({ name: name.trim(), district, isolationBeds: bedsNum, kind: hospital?.kind }, officerId, hospital?.id);
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'The hospital could not be saved.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="hospital-form-title"
        className="bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 id="hospital-form-title" className="text-lg font-semibold text-text-primary">{hospital ? 'Edit hospital' : 'Register hospital'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="hf-name" className={labelCls}>Hospital name</label>
            <input id="hf-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Nyamata District Hospital" />
            {tried && errors.name && <p className="text-[12px] text-accent mt-1">{errors.name}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="hf-district" className={labelCls}>District</label>
              <select id="hf-district" className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)}>
                <option value="">{districtsQ.isLoading ? 'Loading…' : 'Select'}</option>
                {districts.map((d) => <option key={d}>{d}</option>)}
              </select>
              {tried && errors.district && <p className="text-[12px] text-accent mt-1">{errors.district}</p>}
            </div>
            <div>
              <label htmlFor="hf-beds" className={labelCls}>Isolation bed capacity</label>
              <input id="hf-beds" type="number" min={0} className={inputCls} value={beds} onChange={(e) => setBeds(e.target.value)} />
              {tried && errors.beds && <p className="text-[12px] text-accent mt-1">{errors.beds}</p>}
            </div>
          </div>
          <div>
            <label htmlFor="hf-officer" className={labelCls}>Assigned officer</label>
            <select id="hf-officer" className={inputCls} value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
              <option value="">Assign later</option>
              {officers.map((o) =>
              <option key={o.id} value={o.id}>
                  {o.name}{o.hospitalId && o.hospitalId !== hospital?.id ? ` (now at ${hospitalName(o.hospitalId)})` : ''}
                </option>
              )}
            </select>
            {movingOfficer &&
            <p className="text-[12px] text-text-secondary mt-1.5">
                {movingOfficer.name} will move from {hospitalName(movingOfficer.hospitalId)} to this hospital.
              </p>
            }
          </div>
        </div>
        {serverError &&
        <p role="alert" className="mx-6 mb-4 text-[12px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{serverError}</p>
        }
        <div className="px-6 py-4 border-t border-border bg-background flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="disabled:opacity-60 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary-dark transition-colors">
            {hospital ? 'Save changes' : 'Register hospital'}
          </button>
        </div>
      </form>
    </div>);

}