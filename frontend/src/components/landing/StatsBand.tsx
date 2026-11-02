import { landingStats } from '../../data/landing';

export function StatsBand() {
  return (
    <section className="max-w-[1160px] mx-auto px-6 py-16">
      <div className="border border-white/10 rounded-xl grid grid-cols-2 md:grid-cols-4 py-14 gap-y-10">
        {landingStats.map((s) =>
        <div key={s.l} className="text-center">
            <div className="text-[60px] font-normal text-[#1FC7A5] leading-none mb-4 tracking-tight">
              {s.v}
            </div>
            <div className="text-[11px] text-slate-400">{s.l}</div>
          </div>
        )}
      </div>
    </section>);

}