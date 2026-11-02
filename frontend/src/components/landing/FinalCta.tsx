import { ArrowRight } from 'lucide-react';

interface FinalCtaProps {
  onNavigate: (route: string) => void;
}

export function FinalCta({ onNavigate }: FinalCtaProps) {
  return (
    <section className="max-w-[1160px] mx-auto px-6 pb-8">
      <div className="rounded-2xl bg-[#13203A] border border-white/10 px-8 py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        <div>
          <h2 className="text-[32px] sm:text-[40px] font-bold leading-[1.1] tracking-tight max-w-[560px]">
            Ready to model your next outbreak?
          </h2>
          <p className="text-[14px] text-slate-300 mt-4 max-w-[480px] leading-relaxed">
            Sign in to start running simulations, or request an account from your system administrator.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onNavigate('/login')}
            className="bg-[#1FC7A5] hover:bg-[#19B394] text-[#04201A] px-6 py-3 rounded-full text-[13px] font-semibold transition-colors flex items-center whitespace-nowrap">
            
            Get Started
            <ArrowRight size={14} className="ml-2" />
          </button>
          <button
            onClick={() => onNavigate('/request-account')}
            className="border border-white/15 hover:bg-white/5 text-white px-6 py-3 rounded-full text-[13px] font-semibold transition-colors whitespace-nowrap">
            
            Request account
          </button>
        </div>
      </div>
    </section>);

}