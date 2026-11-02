// The prototype showed partner logos here. EpiSim has no endorsements yet, so this strip
// states that plainly instead (see docs/DECISIONS.md).
export function TrustedBy() {
  return (
    <section className="border-t border-white/5">
      <div className="max-w-[1160px] mx-auto px-6 py-8">
        <div className="text-center text-[9px] tracking-[0.2em] text-slate-500 font-code mb-3">
          LOOKING FOR PILOT PARTNERS AND EXPERT ADVISERS
        </div>
        <p className="text-center text-[12px] text-slate-400 max-w-[620px] mx-auto pb-3 border-b border-white/10 leading-relaxed">
          EpiSim is an early demonstration. It has not been validated against outbreak data or reviewed by an
          epidemiologist, and no institution has endorsed it. We are looking for epidemiologists, district health
          teams and public health institutions to review the model and pilot it.
        </p>
      </div>
    </section>
  );
}
