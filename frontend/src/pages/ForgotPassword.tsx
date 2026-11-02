import React, { useState } from 'react';
import { Activity, ArrowLeft } from 'lucide-react';
interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}
export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
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
          <h2 className="text-[24px] font-bold text-text-primary mb-1">
            Reset your password
          </h2>
          <p className="text-body text-text-secondary">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        {/* Form */}
        <div className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-micro text-text-secondary mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@institution.org"
              className="w-full px-4 py-3 rounded-lg border border-border bg-surface text-body text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors" />
            
          </div>

          {/* Send Reset Link Button */}
          <button className="w-full bg-primary hover:bg-primary-dark text-white py-3.5 rounded-xl text-[14px] font-semibold transition-colors shadow-lg shadow-primary/20">
            Send Reset Link
          </button>

          {/* Back to Login */}
          <button
            onClick={() => onNavigate('/login')}
            className="w-full flex items-center justify-center text-[13px] text-text-secondary hover:text-text-primary transition-colors font-medium">
            
            <ArrowLeft size={16} className="mr-2" />
            Back to Sign In
          </button>
        </div>
      </div>
    </div>);

}