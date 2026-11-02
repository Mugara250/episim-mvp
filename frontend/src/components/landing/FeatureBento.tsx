import React, { useState } from "react";
import { Cpu, Globe2, Syringe, Activity, BarChart3, Building2, Users, FileText, ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { exportItems } from "../../data/landing";
interface CardShellProps {
  className: string;
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  desc?: string;
  children?: React.ReactNode;
}
function CardShell({
  className,
  icon: Icon,
  eyebrow,
  title,
  desc,
  children
}: CardShellProps) {
  return <article className={`rounded-xl p-6 relative overflow-hidden flex flex-col ${className}`}>
      <div className="w-7 h-7 rounded-md bg-white/25 flex items-center justify-center mb-4">
        <Icon size={14} className="text-[#0B1220]" />
      </div>
      <div className="text-[9px] tracking-[0.15em] font-code text-[#0B1220]/60 mb-1.5">
        {eyebrow}
      </div>
      <h3 className="text-[19px] font-semibold text-white mb-2">{title}</h3>
      {desc && <p className="text-[11px] text-[#0B1220]/75 leading-[1.7] max-w-[300px]">{desc}</p>}
      {children}
    </article>;
}
function Toggle({
  label,
  defaultOn



}: {label: string;defaultOn: boolean;}) {
  const [on, setOn] = useState(defaultOn);
  return <div className="flex items-center justify-between bg-white/20 rounded-md px-3 py-2">
      <span className="flex items-center text-[10px] text-[#0B1220]/80">
        <Syringe size={10} className="mr-2 opacity-60" />
        {label}
      </span>
      <button role="switch" aria-checked={on} aria-label={label} onClick={() => setOn((v) => !v)} className={`w-7 h-4 rounded-full relative transition-colors duration-150 ${on ? 'bg-[#0E9F86]' : 'bg-white/40'}`}>
        <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-150 ${on ? 'translate-x-3.5' : 'translate-x-0.5'}`} />
      </button>
    </div>;
}
export function FeatureBento() {
  return <section id="features" className="max-w-[1160px] mx-auto px-6 py-24">
      <div className="text-center mb-16">
        <div className="text-[9px] tracking-[0.2em] text-[#1FC7A5] font-code mb-4">
          PLATFORM FEATURES
        </div>
        <h2 className="text-[40px] sm:text-[52px] font-bold leading-[1.12] tracking-tight max-w-[560px] mx-auto">
          Every tool a health analyst needs — in one simulation platform
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 lg:auto-rows-[264px] gap-4">
        {/* AI Simulation Engine */}
        <CardShell className="md:col-span-2 bg-gradient-to-r from-[#22C3A6] to-[#7DD3FC]" icon={Cpu} eyebrow="CORE ENGINE" title="Stochastic SEIHFR Engine" desc="Separates spread in the community, in hospital and at funerals, and runs each scenario hundreds of times so results come as ranges, not single lines.">
          <div className="flex items-center gap-2 mt-auto pt-4 text-[9px] text-[#0B1220]/70">
            <span className="px-2 py-0.5 rounded bg-white/25">SEIHFR</span>
            <span className="px-2 py-0.5 rounded bg-white/25">● Monte Carlo</span>
            <span className="px-2 py-0.5 rounded bg-white/25">30 districts</span>
          </div>
          <div className="hidden sm:block absolute right-6 top-10 w-[42%] h-[60%] rounded-md bg-white/10 border border-white/20">
            <svg viewBox="0 0 200 120" className="w-full h-full" aria-hidden="true">
              <path d="M10,15 C70,15 90,30 110,65 S150,105 190,108" fill="none" stroke="#0B1220" strokeOpacity="0.45" strokeWidth="1.5" />
              <path d="M10,110 C80,110 110,90 130,55 S170,15 190,14" fill="none" stroke="#0B1220" strokeOpacity="0.45" strokeWidth="1.5" />
              <path d="M10,110 C90,110 110,80 130,85 C150,90 165,106 190,108" fill="none" stroke="#F87171" strokeWidth="1.5" />
              <path d="M10,110 C95,110 112,92 125,95 C145,100 165,108 190,109" fill="none" stroke="#FACC15" strokeWidth="1.5" />
            </svg>
          </div>
        </CardShell>

        {/* Geographic Spread */}
        <CardShell className="lg:row-span-2 bg-gradient-to-b from-[#A78BFA] to-[#E879F9] min-h-[300px]" icon={Globe2} eyebrow="SPATIAL ANALYSIS" title="Geographic Spread" desc="See how an outbreak could spread across Rwanda's 30 districts, using an estimated movement model.">
          <div className="mt-auto mx-auto w-[180px] h-[200px] mb-6">
            <svg viewBox="0 0 200 220" className="w-full h-full" aria-hidden="true">
              <path d="M60,30 Q110,15 150,45 Q180,80 165,130 Q150,185 100,195 Q55,195 40,150 Q25,90 60,30 Z" fill="#FFFFFF" fillOpacity="0.08" stroke="#FFFFFF" strokeOpacity="0.3" />
              <circle cx="85" cy="95" r="5" fill="#F87171">
                <animate attributeName="r" values="5;9;5" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="122" cy="88" r="4" fill="#FACC15" />
              <circle cx="115" cy="104" r="3.5" fill="#FB923C" />
              <circle cx="80" cy="128" r="4" fill="#F87171" />
              <circle cx="102" cy="140" r="3" fill="#A855F7" />
            </svg>
          </div>
        </CardShell>

        {/* Intervention Scenarios */}
        <CardShell className="bg-gradient-to-br from-[#34D399] to-[#6EE7B7]" icon={Syringe} eyebrow="POLICY SIMULATION" title="Intervention Scenarios" desc="Contact tracing, isolation, safe burials, testing, vaccination, masking and lockdown, each with a time window.">
          <div className="space-y-2 mt-auto">
            <Toggle label="Vaccination Campaign" defaultOn />
            <Toggle label="Movement Restrictions" defaultOn={false} />
          </div>
        </CardShell>

        {/* Real-Time Monitoring */}
        <CardShell className="bg-gradient-to-br from-[#F87171] to-[#FCA5A5]" icon={Activity} eyebrow="RT TRACKING" title="Is It Growing?" desc="Estimate Rt from daily case counts. Example values shown.">
          <div className="grid grid-cols-2 gap-2 mt-auto">
            <div className="bg-white/20 rounded-md p-2.5">
              <div className="text-[8px] font-code text-[#0B1220]/60">R₀ VALUE</div>
              <div className="text-[20px] font-bold text-white/70 font-code">2.4</div>
            </div>
            <div className="bg-white/20 rounded-md p-2.5">
              <div className="text-[8px] font-code text-[#0B1220]/60">DOUBLING</div>
              <div className="text-[20px] font-bold text-[#FDE047] font-code">6.2d</div>
            </div>
          </div>
        </CardShell>

        {/* Scenario Comparison */}
        <CardShell className="md:col-span-2 bg-gradient-to-r from-[#22C3A6] to-[#7DD3FC]" icon={BarChart3} eyebrow="ANALYSIS TOOL" title="Scenario Comparison">
          <div className="absolute top-6 right-6 hidden sm:flex gap-2 text-[8px] font-code text-[#0B1220]/70">
            <span className="px-2 py-1 rounded bg-white/25">A: No Intervention</span>
            <span className="px-2 py-1 rounded bg-white/15">B: Vaccination</span>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-4 flex-1">
            <div className="flex flex-col">
              <div className="text-[8px] font-code text-[#0B1220]/60 mb-2">
                SCENARIO A — Baseline (No Intervention)
              </div>
              <div className="flex items-end gap-1.5 mt-auto h-full">
                {[25, 45, 70, 85, 70, 50, 30].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#F87171]" style={{
                height: `${h}%`
              }} />)}
              </div>
            </div>
            <div className="flex flex-col">
              <div className="text-[8px] font-code text-[#0B1220]/60 mb-2">
                SCENARIO B — Vaccination + Masking
              </div>
              <div className="flex items-end gap-1.5 mt-auto h-full">
                {[12, 20, 28, 30, 24, 16, 10].map((h, i) => <div key={i} className="flex-1 rounded-t bg-[#22C55E]" style={{
                height: `${h}%`
              }} />)}
              </div>
            </div>
          </div>
        </CardShell>

        {/* Healthcare Capacity */}
        <CardShell className="bg-gradient-to-br from-[#FBBF24] to-[#FDE68A]" icon={Building2} eyebrow="CAPACITY PLANNING" title="Healthcare Capacity" desc="Check isolation-bed demand against capacity profiles.">
          <div className="space-y-3 mt-auto">
            {[{
            label: 'ICU Beds',
            val: 87,
            color: '#EF4444'
          }, {
            label: 'General Wards',
            val: 64,
            color: '#F59E0B'
          }, {
            label: 'Ventilators',
            val: 41,
            color: '#22C55E'
          }].map((item) => <div key={item.label}>
                <div className="flex justify-between text-[9px] mb-1">
                  <span className="text-[#0B1220]/80">{item.label}</span>
                  <span className="font-code" style={{
                color: item.color
              }}>{item.val}%</span>
                </div>
                <div className="h-1 bg-white/40 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                width: `${item.val}%`,
                backgroundColor: item.color
              }} />
                </div>
              </div>)}
          </div>
        </CardShell>

        {/* Role-Based Access */}
        <CardShell className="bg-gradient-to-br from-[#C084FC] to-[#E879F9]" icon={Users} eyebrow="ACCESS CONTROL" title="Role-Based Access" desc="Tailored dashboards for each team member.">
          <div className="mt-auto">
            <div className="flex -space-x-1.5 mb-3">
              {[{
              r: 'Ep',
              c: '#1E3A8A'
            }, {
              r: 'PM',
              c: '#7C3AED'
            }, {
              r: 'An',
              c: '#0F766E'
            }, {
              r: 'Cl',
              c: '#BE185D'
            }, {
              r: '+4',
              c: '#22C3A6'
            }].map((a) => <div key={a.r} className="w-7 h-7 rounded-full border-2 border-[#D8A5FB] flex items-center justify-center text-[9px] font-bold text-white" style={{
              backgroundColor: a.c
            }}>
                  {a.r}
                </div>)}
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#0B1220]/75">
              <span className="flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22C3A6] mr-1.5" />
                Epidemiologist
              </span>
              <span>Full simulation access</span>
            </div>
          </div>
        </CardShell>

        {/* Reporting & Export */}
        <CardShell className="lg:row-span-2 bg-gradient-to-b from-[#2DD4BF] to-[#4ADE80]" icon={FileText} eyebrow="DATA EXPORT" title="Reporting & Export" desc="PDF reports with an approval step, map and table exports, and shareable links.">
          <ul className="space-y-2 mt-5">
            {exportItems.map((item) => <li key={item.name}>
                <button className="w-full flex items-center gap-2.5 bg-white/20 hover:bg-white/30 rounded-md px-3 py-2.5 text-left transition-colors">
                  <span className="w-6 h-6 rounded bg-white/30 flex items-center justify-center flex-shrink-0">
                    <FileText size={11} className="text-[#0B1220]/70" />
                  </span>
                  <span className="flex-1 text-[10px] text-white leading-tight">{item.name}</span>
                  <span className="text-[8px] font-code text-[#0B1220]/50">{item.format}</span>
                  <ArrowRight size={10} className="text-[#0B1220]/50" />
                </button>
              </li>)}
          </ul>
        </CardShell>
      </div>
    </section>;
}