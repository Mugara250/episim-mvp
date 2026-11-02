import { FormEvent, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useAdmin } from '../../context/AdminContext';
import { ROLES, ROLE_LABELS, Role } from '../../lib/rbac';
import { AccountStatus, AdminUser } from '../../types/admin';

const inputCls =
'w-full border border-border bg-background rounded-lg px-3 py-2 text-[13px] text-text-primary focus:outline-none focus:border-primary';
const labelCls = 'block text-[12px] font-medium text-text-secondary mb-1';

export function UserFormDrawer({ user, onClose }: {user: AdminUser | null;onClose: () => void;}) {
  const { hospitals, organisations, saveUser, saving } = useAdmin();
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [role, setRole] = useState<Role>(user?.role ?? 'officer');
  const [organisationId, setOrganisationId] = useState(user && !user.hospitalId ? user.institutionId ?? '' : '');
  const [hospitalId, setHospitalId] = useState(user?.hospitalId ?? '');
  const [status, setStatus] = useState<AccountStatus>(user?.status ?? 'Pending');
  const [password, setPassword] = useState('');
  const [tried, setTried] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const orgValue = organisationId || organisations[0]?.id || '';

  const needsHospital = role === 'officer';
  const errors = {
    name: !name.trim() ? 'Enter a name.' : '',
    email: !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Enter a valid email.' : '',
    hospital: needsHospital && !hospitalId ? 'A Public Health Officer must be assigned to a hospital.' : '',
    password:
    !user && password.length < 6 ?
    'Set an initial password of at least 6 characters.' :
    user && password && password.length < 6 ?
    'Use at least 6 characters, or leave blank to keep the current password.' :
    ''
  };
  const valid = !errors.name && !errors.email && !errors.hospital && !errors.password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    setServerError(null);
    try {
      await saveUser(
        {
          name: name.trim(),
          email: email.trim(),
          role,
          // Officers belong to their hospital; everyone else to their organisation.
          institutionId: needsHospital ? hospitalId : orgValue || undefined,
          status,
          password: password || undefined,
          canEditBuiltins: user?.canEditBuiltins
        },
        user?.id
      );
      onClose();
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'The user could not be saved.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-form-title"
        className="fixed inset-y-0 right-0 w-full max-w-[420px] bg-surface shadow-2xl z-50 flex flex-col border-l border-border">
        
        <div className="px-6 py-5 border-b border-border flex justify-between items-center">
          <h2 id="user-form-title" className="text-lg font-semibold text-text-primary">{user ? 'Edit user' : 'Add user'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-secondary hover:text-text-primary"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label htmlFor="uf-name" className={labelCls}>Full name</label>
            <input id="uf-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} />
            {tried && errors.name && <p className="text-[12px] text-accent mt-1">{errors.name}</p>}
          </div>
          <div>
            <label htmlFor="uf-email" className={labelCls}>Email</label>
            <input id="uf-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
            {tried && errors.email && <p className="text-[12px] text-accent mt-1">{errors.email}</p>}
          </div>
          <div>
            <label htmlFor="uf-role" className={labelCls}>Role</label>
            <select
              id="uf-role"
              className={inputCls}
              value={role}
              onChange={(e) => {
                const next = e.target.value as Role;
                setRole(next);
                if (next !== 'officer') setHospitalId('');
              }}>
              
              {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </select>
          </div>
          {needsHospital &&
          <div>
              <label htmlFor="uf-hosp" className={labelCls}>Hospital (required)</label>
              <select
              id="uf-hosp"
              className={`${inputCls} ${tried && errors.hospital ? 'border-accent' : ''}`}
              value={hospitalId}
              onChange={(e) => setHospitalId(e.target.value)}
              aria-invalid={!!(tried && errors.hospital)}>
              
                <option value="">Select a hospital</option>
                {hospitals.map((h) => <option key={h.id} value={h.id}>{h.name} · {h.district}</option>)}
              </select>
              <p className={`flex items-start gap-1.5 text-[12px] mt-1.5 ${tried && errors.hospital ? 'text-accent' : 'text-text-secondary'}`}>
                <AlertCircle size={13} className="mt-0.5 flex-shrink-0" />
                Officers only see and enter data for this hospital.
              </p>
            </div>
          }
          {!needsHospital &&
          <div>
              <label htmlFor="uf-org" className={labelCls}>Organisation</label>
              <select id="uf-org" className={inputCls} value={orgValue} onChange={(e) => setOrganisationId(e.target.value)}>
                {organisations.length === 0 && <option value="">No organisations registered</option>}
                {organisations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>
          }
          <div>
            <label htmlFor="uf-pass" className={labelCls}>{user ? 'Reset password (optional)' : 'Initial password'}</label>
            <input
              id="uf-pass"
              type="password"
              autoComplete="new-password"
              className={`${inputCls} ${tried && errors.password ? 'border-accent' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={user ? 'Leave blank to keep the current password' : 'At least 6 characters'} />
            {tried && errors.password && <p className="text-[12px] text-accent mt-1">{errors.password}</p>}
          </div>
          <div>
            <label htmlFor="uf-status" className={labelCls}>Account status</label>
            <select id="uf-status" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as AccountStatus)}>
              <option>Active</option>
              <option>Pending</option>
              <option>Inactive</option>
            </select>
          </div>
        </div>

        {serverError &&
        <p role="alert" className="mx-6 mb-4 text-[12px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">{serverError}</p>
        }
        <div className="p-6 border-t border-border flex gap-3 bg-background">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-border rounded-lg text-[13px] font-medium text-text-primary hover:bg-surface transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-[13px] font-medium hover:bg-primary-dark transition-colors disabled:opacity-60">
            {user ? 'Save changes' : 'Add user'}
          </button>
        </div>
      </form>
    </>);

}