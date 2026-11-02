import React from 'react';
import { Globe } from 'lucide-react';

export function TrustedBy() {
  return (
    <section className="border-t border-white/5">
      <div className="max-w-[1160px] mx-auto px-6 py-8">
        <div className="text-center text-[9px] tracking-[0.2em] text-slate-500 font-code mb-5">
          TRUSTED BY PUBLIC HEALTH INSTITUTIONS ACROSS SUB-SAHARAN AFRICA
        </div>
        <div className="flex items-center justify-center gap-x-16 gap-y-6 flex-wrap max-w-[860px] mx-auto pb-3 border-b border-white/10">
          {/* UNICEF */}
          <div className="flex items-center text-[#1CABE2]">
            <span className="text-[38px] font-semibold tracking-tight leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
              unicef
            </span>
            <Globe size={32} className="ml-1" />
          </div>

          {/* Ministry of Health */}
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full border-2 border-[#FACC15] bg-[#16A34A]/30 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-[#38BDF8]" />
            </div>
            <div className="text-[8px] leading-tight text-slate-300">
              <span className="text-[#38BDF8]">Ministry of Health</span>
              <br />
              Republic of Rwanda
            </div>
          </div>

          {/* RBC */}
          <div className="flex items-center gap-2.5">
            <span className="text-[30px] font-bold leading-none" style={{ fontFamily: 'Arial, sans-serif' }}>
              <span className="text-[#38BDF8]">r</span>
              <span className="text-[#38BDF8]">b</span>
              <span className="text-[#FACC15]">c</span>
            </span>
            <span className="text-[11px] font-bold leading-[1.15] text-white" style={{ fontFamily: 'Arial, sans-serif' }}>
              RWANDA
              <br />
              BIOMEDICAL
              <br />
              CENTRE
            </span>
          </div>

          {/* WHO */}
          <div className="flex items-center gap-2 text-[#3B9BE8]">
            <Globe size={34} />
            <div className="leading-tight" style={{ fontFamily: 'Arial, sans-serif' }}>
              <div className="text-[12px]">World Health</div>
              <div className="text-[12px]">Organization</div>
              <div className="text-[8px] text-slate-400">Regional Office for <span className="text-[#3B9BE8] font-bold">Africa</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>);

}