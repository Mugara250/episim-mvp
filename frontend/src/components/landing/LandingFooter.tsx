import React from 'react';
import { Github, Linkedin, Mail, Twitter } from 'lucide-react';
import { footerColumns } from '../../data/landing';
import { LandingLogo } from './LandingNav';

const socials = [
{ icon: Twitter, label: 'X / Twitter' },
{ icon: Github, label: 'GitHub' },
{ icon: Linkedin, label: 'LinkedIn' },
{ icon: Mail, label: 'Email' }];


export function LandingFooter() {
  return (
    <footer className="max-w-[1160px] mx-auto px-6 pt-24 pb-8">
      <div className="grid grid-cols-2 md:grid-cols-12 gap-10 mb-20">
        <div className="col-span-2 md:col-span-5">
          <LandingLogo />
          <p className="text-[11px] text-slate-400 leading-[1.9] max-w-[260px] mt-5">
            AI-driven epidemic simulation for public health authorities in
            developing countries. Built to protect communities before outbreaks
            become crises.
          </p>
          <div className="flex gap-2 mt-6">
            {socials.map((s) =>
            <a
              key={s.label}
              href="#"
              aria-label={s.label}
              className="w-7 h-7 rounded-md bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-300 transition-colors">
              
                <s.icon size={12} />
              </a>
            )}
          </div>
        </div>

        {footerColumns.map((col) =>
        <div key={col.title} className="md:col-span-2 md:col-start-auto">
            <div className="text-[9px] tracking-[0.2em] text-slate-500 font-code mb-5">
              {col.title}
            </div>
            <ul className="space-y-3">
              {col.items.map((item) =>
            <li key={item}>
                  <a href="#" className="text-[11px] text-[#1FC7A5] hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
            )}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap justify-between items-center gap-4 text-[10px]">
        <div className="text-[#1FC7A5]/80">
          © 2026 EpiSim. Built for public health professionals in developing countries.
        </div>
        <div className="font-code text-[#1FC7A5]/80">
          Epidemic Intelligence · Africa-first · Open science
        </div>
      </div>
    </footer>);

}