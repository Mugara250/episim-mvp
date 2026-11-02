import { useState } from 'react';
import {
  Activity,
  Smartphone,
  Mail,
  MessageSquare,
  KeyRound,
  ChevronRight } from
'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
interface MFAProps {
  onNavigate: (route: string) => void;
}
export function MFA({ onNavigate }: MFAProps) {
  const { role } = useAuth();
  const from = (useLocation().state as {from?: string;} | null)?.from;
  const home = role === 'admin' ? '/admin/users' : '/dashboard';
  const next = from && (role === 'admin') === from.startsWith('/admin') ? from : home;
  const [selectedMethod, setSelectedMethod] = useState<string>('app');
  const methods = [
  {
    id: 'app',
    icon: Smartphone,
    title: 'AUTHENTICATION APP',
    subtitle: 'Use Google Authenticator, Authy, or Microsoft Authenticator',
    recommended: true
  },
  {
    id: 'email',
    icon: Mail,
    title: 'EMAIL CODE',
    subtitle: 'Send a code to your email',
    recommended: false
  },
  {
    id: 'sms',
    icon: MessageSquare,
    title: 'SMS CODE',
    subtitle: 'Send a code to your phone',
    recommended: false
  },
  {
    id: 'key',
    icon: KeyRound,
    title: 'SECURITY KEY',
    subtitle: 'Use a hardware security key (FIDO2)',
    recommended: false
  }];

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4 font-sans">
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
        <div className="text-center mb-10">
          <h1 className="text-[18px] font-semibold text-text-secondary mb-2">
            Epidemic Spread Simulation System
          </h1>
          <p className="text-text-primary font-medium">
            Add an extra layer of security to your account
          </p>
          <p className="mt-3 inline-block text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-full px-3 py-1">
            Mock step in this demo: no code is sent or checked
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center justify-between mb-12 relative px-4">
          <div className="absolute top-4 left-8 right-8 h-[1px] bg-border -z-10"></div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-[13px] font-semibold mb-2 shadow-sm">
              1
            </div>
            <span className="text-[11px] font-medium text-primary">
              Scan QR Code
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-surface border border-border text-text-secondary flex items-center justify-center text-[13px] font-semibold mb-2">
              2
            </div>
            <span className="text-[11px] font-medium text-text-secondary">
              Verify Code
            </span>
          </div>

          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full bg-surface border border-border text-text-secondary flex items-center justify-center text-[13px] font-semibold mb-2">
              3
            </div>
            <span className="text-[11px] font-medium text-text-secondary">
              Backup Code
            </span>
          </div>
        </div>

        {/* Methods */}
        <div className="mb-8">
          <div className="text-micro text-text-secondary mb-4">
            SELECT YOUR VERIFICATION METHOD
          </div>

          <div className="space-y-3">
            {methods.map((method) =>
            <div
              key={method.id}
              onClick={() => setSelectedMethod(method.id)}
              className={`flex items-center p-4 rounded-xl border cursor-pointer transition-all ${selectedMethod === method.id ? 'border-primary bg-hover shadow-sm' : 'border-border hover:border-primary/30 hover:bg-background'}`}>
              
                <div
                className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 flex-shrink-0 ${selectedMethod === method.id ? 'border-primary' : 'border-border'}`}>
                
                  {selectedMethod === method.id &&
                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                }
                </div>

                <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 ${selectedMethod === method.id ? 'bg-primary text-white' : 'bg-background text-primary'}`}>
                
                  <method.icon size={20} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center mb-0.5">
                    <span className="text-[12px] font-bold text-text-primary tracking-wide">
                      {method.title}
                    </span>
                    {method.recommended &&
                  <span className="ml-2 bg-hover text-primary text-[10px] font-bold px-1.5 py-0.5 rounded">
                        Recommended
                      </span>
                  }
                  </div>
                  <p className="text-[12px] text-text-secondary truncate">
                    {method.subtitle}
                  </p>
                </div>

                <ChevronRight size={16} className="text-text-secondary ml-2" />
              </div>
            )}
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() =>
          onNavigate(next)
          }
          className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl text-[14px] font-semibold transition-colors shadow-sm">
          
          Continue
        </button>
      </div>
    </div>);

}