import { landingModules } from '../../data/landing';

export function ModulesStrip() {
  return (
    <section id="modules" className="py-24">
      <div className="max-w-[1160px] mx-auto px-6 mb-16">
        <div className="flex items-center text-[9px] tracking-[0.2em] text-[#1FC7A5] font-code mb-8">
          <span className="w-6 h-px bg-[#1FC7A5] mr-3" />
          14 MODULES
        </div>
        <h2 className="lg:ml-[29%] text-[40px] sm:text-[52px] font-bold leading-[1.12] tracking-tight max-w-[520px]">
          A complete platform, purpose-built for epidemiology
        </h2>
      </div>

      <div className="no-scrollbar overflow-x-auto">
        <ul className="flex gap-2.5 px-8 w-max">
          {landingModules.map((m) =>
          <li
            key={m.label}
            className="w-[184px] h-[108px] bg-[#13203A] border border-white/5 rounded-lg p-4 flex-shrink-0">
            
              <div
              className="w-7 h-7 rounded-md flex items-center justify-center mb-3"
              style={{ backgroundColor: `${m.tint}22` }}>
              
                <m.icon size={14} style={{ color: m.tint }} />
              </div>
              <div className="text-[11px] font-semibold text-white mb-1 whitespace-nowrap">
                {m.label}
              </div>
              <div className="text-[9px] text-slate-400 leading-snug">{m.desc}</div>
            </li>
          )}
        </ul>
      </div>
    </section>);

}