import { useState } from 'react';
import { Activity, ArrowLeft, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useAccountRequests } from '../context/AccountRequestContext';
import { RequestStatusBanner } from '../components/auth/RequestStatusBanner';
import { Role } from '../lib/rbac';
import { ApiError } from '../api/http';
import { useLocation, useNavigate } from 'react-router-dom';
interface LoginProps {
  onNavigate: (route: string) => void;
}
// Demo credentials — one user per role
const DEMO_USERS: Record<
  string,
  {
    password: string;
    role: Role;
    name: string;
    roleLabel: string;
  }> =
{
  'admin@moh.gov.rw': {
    password: 'admin123',
    role: 'admin',
    name: 'Dr. Jean Damascene',
    roleLabel: 'Administrator'
  },
  'epidemiologist@rbc.gov.rw': {
    password: 'epi123',
    role: 'analyst',
    name: 'Aline Uwase',
    roleLabel: 'Epidemiologist'
  },
  'officer@who.int': {
    password: 'officer123',
    role: 'officer',
    name: 'Dr. Robert K.',
    roleLabel: 'Public Health Officer'
  },
  'policymaker@moh.gov.rw': {
    password: 'policy123',
    role: 'policymaker',
    name: 'Hon. Minister',
    roleLabel: 'Policy Maker'
  }
};
export function Login({ onNavigate }: LoginProps) {
  const { login } = useAuth();
  const navigate = useNavigate();
  // Deep link the user tried to open before signing in (e.g. a shared comparison).
  const from = (useLocation().state as {from?: string;} | null)?.from;
  const toMfa = () => navigate('/mfa', { state: from ? { from } : undefined });
  const [submitting, setSubmitting] = useState(false);
  const { myRequest, lookupRequest } = useAccountRequests();
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoCreds, setShowDemoCreds] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    institution: '',
    email: '',
    password: '',
    remember: false
  });
  const institutions = [
  'Ministry of Health Rwanda',
  'WHO Africa',
  'Rwanda Biomedical Center',
  'UNICEF',
  'Other'];

  const handleSignIn = async () => {
    if (submitting) return;
    setError(null);
    const emailKey = formData.email.trim().toLowerCase();
    if (!emailKey || !formData.password) {
      setError('Enter your email address and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(emailKey, formData.password);
      toMfa();
      return;
    } catch (e) {
      // Before showing the server's message, check whether this email has an account request.
      // Approved requests already have a real account, so they never reach this point with the right password.
      const request = await lookupRequest(emailKey).catch(() => undefined);
      if (request?.status === 'Pending') {
        setError('Your account request is still awaiting administrator approval. You’ll be notified once it’s approved.');
        return;
      }
      if (request?.status === 'Rejected') {
        setError(`Your account request was declined: ${request.rejectionReason ?? 'details could not be verified.'}`);
        return;
      }
      if (e instanceof ApiError && (e.status === 401 || e.status === 400 || e.status === 404)) {
        setError(
          DEMO_USERS[emailKey] ?
          'Incorrect password for this account.' :
          'No account found with that email and password. Request an account or try one of the demo accounts above.'
        );
      } else {
        setError(e instanceof ApiError ? e.message : 'Could not reach the EpiSim server. Check that the backend is running.');
      }
    } finally {
      setSubmitting(false);
    }
  };
  const quickFill = (email: string) => {
    const user = DEMO_USERS[email];
    if (!user) return;
    setFormData({
      ...formData,
      email,
      password: user.password
    });
    setError(null);
  };
  return (
    <div className="relative min-h-screen w-full bg-surface flex flex-col items-center justify-center p-4 pt-16 font-sans">
      <button
        onClick={() => onNavigate('/')}
        className="absolute top-5 left-5 flex items-center gap-1.5 px-3 py-2 rounded-lg text-[13px] font-medium text-text-secondary hover:text-text-primary hover:bg-background transition-colors">
        
        <ArrowLeft size={16} />
        Back to home
      </button>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div
          className="flex justify-center mb-8 cursor-pointer"
          onClick={() => onNavigate('/')}>
          
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center shadow-glow">
            <Activity size={24} className="text-white" />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-[18px] font-semibold text-text-secondary mb-2">
            Epidemic Spread Simulation System
          </h1>
          <h2 className="text-[24px] font-bold text-text-primary mb-1">
            Welcome back
          </h2>
          <p className="text-body text-text-secondary">
            Sign in to your account
          </p>
        </div>

        {myRequest &&
        <div className="mb-6">
            <RequestStatusBanner
            request={myRequest}
            onUseEmail={() => {
              setFormData((f) => ({ ...f, email: myRequest.email, password: '' }));
              setError(null);
            }} />
          
          </div>
        }

        {/* Demo Credentials Helper */}
        {showDemoCreds &&
        <div className="mb-6 bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center">
                <Info size={16} className="text-primary mr-2" />
                <span className="text-[12px] font-bold text-text-primary tracking-wide">
                  DEMO ACCOUNTS — CLICK TO AUTO-FILL
                </span>
              </div>
              <button
              onClick={() => setShowDemoCreds(false)}
              className="text-[11px] text-text-secondary hover:text-text-primary">
              
                Hide
              </button>
            </div>
            <div className="space-y-2">
              {Object.entries(DEMO_USERS).map(([email, user]) =>
            <button
              key={email}
              onClick={() => quickFill(email)}
              className="w-full text-left p-2.5 rounded-lg bg-surface border border-border hover:border-primary/40 transition-colors group">
              
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[12px] font-semibold text-text-primary">
                      {user.roleLabel}
                    </span>
                    <span className="text-[10px] text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Click to fill →
                    </span>
                  </div>
                  <div className="text-[11px] text-text-secondary font-mono">
                    {email} · {user.password}
                  </div>
                </button>
            )}
            </div>
          </div>
        }

        {!showDemoCreds &&
        <button
          onClick={() => setShowDemoCreds(true)}
          className="w-full mb-4 text-[12px] text-primary hover:underline font-medium text-center">
          
            Show demo credentials
          </button>
        }

        {/* Form */}
        <div className="space-y-5">
          {/* Error */}
          {error &&
          <div className="flex items-start bg-danger/10 border border-danger/30 rounded-lg p-3">
              <AlertCircle
              size={16}
              className="text-danger mt-0.5 mr-2 flex-shrink-0" />
            
              <p className="text-[12px] text-danger leading-snug">{error}</p>
            </div>
          }

          {/* Institution */}
          <div>
            <label className="block text-micro text-text-secondary mb-2">
              INSTITUTION
            </label>
            <select
              value={formData.institution}
              onChange={(e) =>
              setFormData({
                ...formData,
                institution: e.target.value
              })
              }
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors">
              
              <option value="">Select your institution</option>
              {institutions.map((inst) =>
              <option key={inst} value={inst}>
                  {inst}
                </option>
              )}
            </select>
          </div>

          {/* Email */}
          <div>
            <label className="block text-micro text-text-secondary mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
              setFormData({
                ...formData,
                email: e.target.value
              })
              }
              onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
              placeholder="you@institution.org"
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            
          </div>

          {/* Password */}
          <div>
            <label className="block text-micro text-text-secondary mb-2">
              PASSWORD
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  password: e.target.value
                })
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSignIn()}
                placeholder="Enter your password"
                className="w-full px-4 py-3 pr-12 rounded-lg border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors">
                
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember & Forgot */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.remember}
                onChange={(e) =>
                setFormData({
                  ...formData,
                  remember: e.target.checked
                })
                }
                className="w-4 h-4 rounded border-border text-primary focus:ring-2 focus:ring-primary/20" />
              
              <span className="ml-2 text-[13px] text-text-primary">
                Remember me
              </span>
            </label>
            <button
              onClick={() => onNavigate('/forgot')}
              className="text-[13px] text-primary hover:underline font-medium">
              
              Forgot password?
            </button>
          </div>

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark disabled:opacity-60 text-white py-3.5 rounded-xl text-[14px] font-semibold transition-colors shadow-lg shadow-primary/20">
            
            {submitting ? 'Signing in…' : 'Sign In'}
          </button>

          {/* Register Link */}
          <p className="text-center text-[13px] text-text-secondary">
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('/request-account')}
              className="text-primary hover:underline font-semibold">
              
              Request account
            </button>
          </p>
        </div>
      </div>
    </div>);

}