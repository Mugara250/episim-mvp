import { workflowSteps } from '../../data/landing';

export function WorkflowSteps() {
  return (
    <section id="workflow" className="max-w-[1160px] mx-auto px-6 py-28 text-center">
      <div className="text-[9px] tracking-[0.2em] text-[#1FC7A5] font-code mb-4">
        WORKFLOW
      </div>
      <h2 className="text-[40px] sm:text-[52px] font-bold leading-[1.15] tracking-tight mb-20">
        From data to decision
        <br />
        in three steps
      </h2>

      <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12 max-w-[1000px] mx-auto">
        <div className="hidden md:block absolute top-9 left-[16.66%] right-[16.66%] h-px bg-white/10" aria-hidden="true" />
        {workflowSteps.map((step) =>
        <div key={step.n} className="relative">
            <div className="w-[72px] h-[72px] mx-auto rounded-full bg-[#13203A] border border-white/15 flex items-center justify-center text-[#1FC7A5] text-[20px] font-code mb-10">
              {step.n}
            </div>
            <h3 className="text-[24px] font-bold mb-5">{step.title}</h3>
            <p className="text-[12px] text-slate-400 leading-[1.9] max-w-[260px] mx-auto">
              {step.desc}
            </p>
          </div>
        )}
      </div>
    </section>);

}