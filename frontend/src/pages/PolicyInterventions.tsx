import React from 'react';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { interventionReview } from '../data/interventionReview';
import { InterventionReview } from '../types/policy';

const STATUS_TONE: Record<InterventionReview['status'], string> = {
  Recommended: 'bg-success/15 text-success',
  'Under review': 'bg-warning/15 text-warning',
  'Not recommended': 'bg-surface-2 text-text-secondary'
};

export function PolicyInterventions() {
  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="mb-2">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Interventions</h1>
          <ViewOnlyBadge />
        </div>
        <p className="text-body text-text-secondary">
          Actions the response team has tested in approved scenarios, with the likely effect of each. Effects are ranges, not guarantees.
        </p>
      </div>

      <section className="bg-surface rounded-xl border border-border overflow-hidden">
        <ul className="divide-y divide-border">
          {interventionReview.map((i) =>
          <li key={i.id} className="p-6 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-4 md:gap-8">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-[15px] font-semibold text-text-primary">{i.name}</h2>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_TONE[i.status]}`}>{i.status}</span>
                </div>
                <p className="text-[13px] text-text-secondary mt-1.5">{i.description}</p>
                <p className="text-[12px] text-text-secondary mt-2">
                  {i.disease === 'Both' ? 'Ebola and Marburg' : i.disease} · cost {i.cost.toLowerCase()} · based on {i.basis}
                </p>
              </div>
              <div className="md:text-right">
                <div className="text-micro text-text-secondary">LIKELY EFFECT</div>
                <div className="text-[15px] font-semibold text-text-primary mt-1">{i.effectRange}</div>
                <div className="text-[12px] text-text-secondary">{i.effect}</div>
              </div>
            </li>
          )}
        </ul>
      </section>
    </div>);

}