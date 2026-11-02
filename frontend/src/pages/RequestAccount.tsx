import { ChangeEvent, FormEvent, useState } from 'react';
import { Activity, ArrowLeft, Loader2, Send } from 'lucide-react';
import { AuthField } from '../components/auth/AuthField';
import { RequestStatusBanner } from '../components/auth/RequestStatusBanner';
import { useAccountRequests } from '../context/AccountRequestContext';
import { isValidEmail, REQUEST_INSTITUTIONS as requestInstitutions } from '../utils/accountRequests';

interface RequestAccountProps {
  onNavigate: (route: string) => void;
}

type FormKey = 'name' | 'email' | 'institution' | 'otherInstitution' | 'institutionAccountId' | 'position' | 'password' | 'confirmPassword';
type FormState = Record<FormKey, string>;

const EMPTY: FormState = {
  name: '',
  email: '',
  institution: '',
  otherInstitution: '',
  institutionAccountId: '',
  position: '',
  password: '',
  confirmPassword: ''
};

export function RequestAccount({ onNavigate }: RequestAccountProps) {
  const { submitRequest, myRequest } = useAccountRequests();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<FormKey, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  const set = (key: FormKey) => (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er: Partial<Record<FormKey, string>> = {};
    if (!form.name.trim()) er.name = 'Enter your full name.';
    // Whether the email is already in use is checked by the server on submit.
    if (!isValidEmail(form.email)) er.email = 'Enter a valid work email.';
    if (!form.institution) er.institution = 'Select your institution.';
    if (form.institution === 'Other' && !form.otherInstitution.trim()) er.otherInstitution = 'Enter your institution’s name.';
    if (!form.institutionAccountId.trim()) er.institutionAccountId = 'Enter your institution account ID.';
    if (!form.position.trim()) er.position = 'Enter your role or position.';
    if (form.password.length < 8) er.password = 'Use at least 8 characters.';
    if (form.confirmPassword !== form.password) er.confirmPassword = 'Passwords don’t match.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await submitRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        institution: form.institution === 'Other' ? form.otherInstitution.trim() : form.institution,
        institutionAccountId: form.institutionAccountId.trim(),
        position: form.position.trim(),
        password: form.password
      });
      setForm(EMPTY);
    } catch (err) {
      // e.g. 409: an account or open request already uses this email.
      setSubmitError(err instanceof Error ? err.message : 'Your request could not be sent. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitted = !!myRequest;

  return (
    <div className="min-h-screen w-full bg-surface flex flex-col items-center justify-center p-4 py-12 font-sans">
      <div className="w-full max-w-lg">
        <button onClick={() => onNavigate('/')} className="flex justify-center mb-8 mx-auto" aria-label="EpiSim home">
          <span className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Activity size={24} className="text-white" />
          </span>
        </button>

        <div className="text-center mb-8">
          <h1 className="text-[18px] font-semibold text-text-secondary mb-2">Epidemic Spread Simulation System</h1>
          <h2 className="text-[24px] font-bold text-text-primary mb-1">{submitted ? 'Request sent' : 'Request an account'}</h2>
          <p className="text-body text-text-secondary">
            {submitted ?
            'The system administrator will verify your details with your institution.' :
            'Accounts are created by the system administrator after verifying your institution.'}
          </p>
        </div>

        {submitted && myRequest ?
        <div className="space-y-5">
            <RequestStatusBanner request={myRequest} />
            <dl className="rounded-xl border border-border divide-y divide-border text-[13px]">
              {[
            ['Name', myRequest.name],
            ['Email', myRequest.email],
            ['Institution', myRequest.institution],
            ['Institution account ID', myRequest.institutionAccountId],
            ['Role / position', myRequest.position]].
            map(([k, v]) =>
            <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                  <dt className="text-text-secondary">{k}</dt>
                  <dd className="text-text-primary font-medium text-right">{v}</dd>
                </div>
            )}
            </dl>
            <button
            onClick={() => onNavigate('/login')}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl text-[14px] font-semibold transition-colors">
            
              Back to sign in
            </button>
          </div> :

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {submitError &&
            <p role="alert" className="text-[13px] text-danger bg-danger/10 border border-danger/20 rounded-xl px-4 py-3">{submitError}</p>
            }
            <AuthField id="req-name" label="FULL NAME" error={errors.name}>
              {(p) => <input {...p} type="text" value={form.name} onChange={set('name')} placeholder="Dr. Jane Mukamana" autoComplete="name" />}
            </AuthField>

            <AuthField id="req-email" label="WORK EMAIL" hint="You’ll sign in with this email once approved." error={errors.email}>
              {(p) => <input {...p} type="email" value={form.email} onChange={set('email')} placeholder="you@institution.org" autoComplete="email" />}
            </AuthField>

            <AuthField id="req-institution" label="INSTITUTION" error={errors.institution}>
              {(p) =>
            <select {...p} value={form.institution} onChange={set('institution')}>
                  <option value="">Select your institution</option>
                  {requestInstitutions.map((i) =>
              <option key={i} value={i}>{i}</option>
              )}
                </select>
            }
            </AuthField>

            {form.institution === 'Other' &&
          <AuthField id="req-other" label="INSTITUTION NAME" error={errors.otherInstitution}>
                {(p) => <input {...p} type="text" value={form.otherInstitution} onChange={set('otherInstitution')} placeholder="Name of your institution" />}
              </AuthField>
          }

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AuthField id="req-account-id" label="INSTITUTION ACCOUNT ID" hint="Staff or employee ID." error={errors.institutionAccountId}>
                {(p) => <input {...p} type="text" value={form.institutionAccountId} onChange={set('institutionAccountId')} placeholder="RBC-STF-0000" />}
              </AuthField>
              <AuthField id="req-position" label="ROLE / POSITION" hint="Your title at the institution." error={errors.position}>
                {(p) => <input {...p} type="text" value={form.position} onChange={set('position')} placeholder="District Epidemiologist" />}
              </AuthField>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <AuthField id="req-password" label="PASSWORD" error={errors.password}>
                {(p) => <input {...p} type="password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" autoComplete="new-password" />}
              </AuthField>
              <AuthField id="req-confirm" label="CONFIRM PASSWORD" error={errors.confirmPassword}>
                {(p) => <input {...p} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" autoComplete="new-password" />}
              </AuthField>
            </div>

            <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl text-[14px] font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait">
            
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              {submitting ? 'Sending request…' : 'Send request to administrator'}
            </button>

            <button
            type="button"
            onClick={() => onNavigate('/login')}
            className="w-full flex items-center justify-center gap-1.5 text-[13px] text-text-secondary hover:text-text-primary transition-colors">
            
              <ArrowLeft size={14} />
              Already have an account? Sign in
            </button>
          </form>
        }
      </div>
    </div>);

}