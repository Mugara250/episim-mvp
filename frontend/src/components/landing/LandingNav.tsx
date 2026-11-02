import React from 'react';
import { Activity, ArrowRight } from 'lucide-react';
import { navLinks } from '../../data/landing';

interface LandingNavProps {
  onNavigate: (route: string) => void;
}

export function LandingLogo() {
  return (
    <div className="flex items-center">
      <div className="w-8 h-8 bg-[#1FC7A5] rounded-lg flex items-center justify-center mr-2.5">
        <Activity size={16} className="text-[#0B1220]" strokeWidth={2.5} />
      </div>
      <div className="leading-none">
        <div className="font-bold text-[15px] text-white">EpiSim</div>
        <div className="text-[9px] text-slate-400 mt-0.5">Simulation System</div>
      </div>
    </div>);

}

export function LandingNav({ onNavigate }: LandingNavProps) {
  return (
    <header className="max-w-[1160px] mx-auto px-6 py-5 flex items-center justify-between">
      <div className="flex items-center gap-12">
        <button onClick={() => onNavigate('/')} aria-label="EpiSim home">
          <LandingLogo />
        </button>
        <nav className="hidden md:flex items-center gap-8 text-[12px] text-slate-300">
          {navLinks.map((l) =>
          <a
            key={l.label}
            href={l.href}
            className="hover:text-white transition-colors">
            
              {l.label}
            </a>
          )}
          <button
            onClick={() => onNavigate('/login')}
            className="hover:text-white transition-colors">
            
            Login
          </button>
        </nav>
      </div>
      <button
        onClick={() => onNavigate('/login')}
        className="bg-[#1FC7A5] hover:bg-[#19B394] text-[#04201A] px-5 py-2 rounded-full text-[12px] font-semibold transition-colors flex items-center whitespace-nowrap">
        
        Launch Dashboard
        <ArrowRight size={13} className="ml-1.5" />
      </button>
    </header>);

}