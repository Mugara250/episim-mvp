import React from 'react';
import { Play } from 'lucide-react';
import { HeroChart } from './HeroChart';

interface LandingHeroProps {
  onNavigate: (route: string) => void;
}

export function LandingHero({ onNavigate }: LandingHeroProps) {
  return (
    <section className="max-w-[1160px] mx-auto px-6 pt-10 pb-28">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#1FC7A5]/10 border border-[#1FC7A5]/20 text-[10px] font-code text-[#1FC7A5] mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1FC7A5] mr-2 animate-pulse" />
            Live Simulation Engine · Active
          </div>

          <h1 className="text-[64px] sm:text-[96px] leading-[1] font-bold tracking-tight mb-12">
            <span className="block text-white">Predict.</span>
            <span className="block text-[#1FC7A5]">Prepare.</span>
            <span className="block text-white">Protect.</span>
          </h1>

          <p className="text-[14px] text-slate-300 max-w-[400px] mb-14 leading-[1.75]">
            AI-driven epidemic simulation for public health authorities in
            developing countries — built on SEIR, agent-based, and network
            transmission models.
          </p>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('/login')}
              className="bg-[#1FC7A5] hover:bg-[#19B394] text-[#04201A] px-6 py-3 rounded-full text-[12px] font-semibold transition-colors whitespace-nowrap">
              
              Start Simulation
            </button>
            <button className="border border-white/15 hover:bg-white/5 text-white px-5 py-3 rounded-full text-[12px] font-semibold transition-colors flex items-center whitespace-nowrap">
              <span className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center mr-2.5">
                <Play size={8} className="fill-white text-white" />
              </span>
              Watch Demo
            </button>
          </div>
        </div>

        <div className="lg:pl-10 lg:pt-6">
          <HeroChart />
        </div>
      </div>
    </section>);

}