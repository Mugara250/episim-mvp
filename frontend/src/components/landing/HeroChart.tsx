
const yLabels = ['100k', '75k', '50k', '25k', '0k'];
const xLabels = ['0d', '50d', '100d', '150d', '200d'];

const legend = [
{ label: 'Susceptible (S)', color: '#3B82F6' },
{ label: 'Exposed (E)', color: '#FACC15' },
{ label: 'Infectious (I)', color: '#F87171' },
{ label: 'Recovered (R)', color: '#1FC7A5' }];


export function HeroChart() {
  return (
    <div className="relative">
      <div className="bg-[#13203A] rounded-2xl border border-white/10 px-6 pt-5 pb-4 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)]">
        {/* R0 chip */}
        <div className="absolute -top-4 left-8 bg-[#0E1729] border border-[#1FC7A5]/40 rounded-md px-3 py-1.5 text-[11px] font-code text-[#1FC7A5]">
          Illustrative
        </div>

        <div className="flex justify-between items-center mb-3">
          <div className="text-[10px] tracking-wider text-slate-400 font-code">
            SEIHFR MODEL · ILLUSTRATIVE CURVES
          </div>
          <div className="flex items-center text-[10px] text-slate-400">
            Not model output
          </div>
        </div>

        <div className="relative h-[270px]">
          <svg viewBox="0 0 520 280" className="w-full h-full" role="img" aria-label="SEIR projection curves">
            {yLabels.map((l, i) =>
            <g key={l}>
                <line x1="44" x2="515" y1={20 + i * 55} y2={20 + i * 55} stroke="#22314F" strokeWidth="1" />
                <text x="0" y={24 + i * 55} fill="#64748B" fontSize="10" fontFamily="JetBrains Mono, monospace">
                  {l}
                </text>
              </g>
            )}
            <line x1="44" x2="44" y1="20" y2="240" stroke="#22314F" />
            {xLabels.map((l, i) =>
            <text
              key={l}
              x={44 + i * 117}
              y="262"
              fill="#64748B"
              fontSize="10"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace">
              
                {l}
              </text>
            )}
            {/* Susceptible */}
            <path d="M44,28 C190,28 250,40 300,120 S400,232 515,236" fill="none" stroke="#3B82F6" strokeWidth="2" />
            {/* Recovered */}
            <path d="M44,240 C230,240 290,220 340,140 S430,52 505,44" fill="none" stroke="#1FC7A5" strokeWidth="2" />
            {/* Infectious */}
            <path d="M44,240 C240,240 300,196 345,200 C390,204 430,234 515,237" fill="none" stroke="#F87171" strokeWidth="2" />
            {/* Exposed */}
            <path d="M44,240 C250,240 300,212 335,218 C375,224 420,238 515,239" fill="none" stroke="#FACC15" strokeWidth="2" />
          </svg>

          <div className="absolute top-[36%] -right-12 bg-[#0E1729] border border-white/10 rounded-md px-3 py-1.5 text-[11px] font-code text-slate-300 shadow-lg">
            Compare up to 3 runs
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[10px] text-slate-400 font-code">
          {legend.map((l) =>
          <div key={l.label} className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full mr-1.5" style={{ backgroundColor: l.color }} />
              {l.label}
            </div>
          )}
        </div>
      </div>

      {/* Day 45 chip */}
      <div className="absolute bottom-12 -left-5 bg-[#0E1729] border border-[#FACC15]/40 rounded-md px-3 py-1.5 text-[11px] font-code text-[#FACC15] shadow-lg">
        Day 45 Projection
      </div>
    </div>);

}