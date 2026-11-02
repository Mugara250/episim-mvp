import React from 'react';
import { Info } from 'lucide-react';
import { useScenarioRefs } from '../../api/scenarios';
import { Scenario } from '../../types/scenarios';
import { findPackage, findPreset, formatPop, pct } from '../../utils/scenarios';

function Block({ title, children }: {title: string;children: React.ReactNode;}) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <h4 className="text-[12px] font-semibold text-text-secondary mb-2">{title}</h4>
      {children}
    </div>);

}

function Fact({ label, value }: {label: string;value: string;}) {
  return (
    <div>
      <dt className="text-[11px] text-text-secondary">{label}</dt>
      <dd className="text-[14px] font-semibold text-text-primary tabular-nums">{value}</dd>
    </div>);

}

/** Read-only review of what the chosen scenario will feed into the model. */
export function WhatWillRun({ scenario }: {scenario: Scenario;}) {
  const refs = useScenarioRefs();
  const preset = findPreset(refs.presets, scenario.presetId);
  const pkg = findPackage(refs.packages, scenario.packageId);

  return (
    <section aria-labelledby="what-will-run" className="rounded-xl border border-border bg-background p-5">
      <h3 id="what-will-run" className="text-[14px] font-semibold text-text-primary mb-4">What will run</h3>
      <div className="divide-y divide-border">
        <Block title="Population">
          {scenario.datasetName ?
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Fact label="Dataset" value={scenario.datasetName} />
              <Fact label="Version (locked)" value={`v${scenario.datasetVersion ?? scenario.datasetLatestVersion}`} />
              <Fact label="Total people" value={scenario.population ? formatPop(scenario.population) : '—'} />
            </dl> :

          <p className="text-[13px] text-danger">This scenario’s dataset is no longer available.</p>
          }
        </Block>
        <Block title="Disease">
          {preset ?
          <>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Fact label="Preset" value={preset.provisional ? `${preset.name} · Provisional` : preset.name} />
                <Fact label="R0 (likely)" value={preset.r0Likely.toFixed(1)} />
                <Fact label="Incubation" value={`${preset.incubationDays} days`} />
                <Fact label="Fatality, admitted" value={pct(preset.cfrHospital)} />
              </dl>
              <p className="text-[11px] text-text-secondary mt-2">Reference: {preset.reference}</p>
            </> :
          refs.isLoading ?
          <p className="text-[13px] text-text-secondary">Loading…</p> :

          <p className="text-[13px] text-danger">This scenario’s disease preset is no longer available.</p>
          }
        </Block>
        <Block title="Interventions">
          {pkg ?
          <>
              <p className="text-[13px] font-medium text-text-primary mb-2">{pkg.name}</p>
              <ul className="space-y-1.5">
                {pkg.items.map((item) =>
              <li key={item.id} className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-text-primary">{item.typeName}</span>
                    <span className="text-text-secondary tabular-nums whitespace-nowrap">
                      from day {item.startDay}
                      {item.endDay == null ? ', ongoing' : ` to ${item.endDay}`} · {Math.round(item.coverage * 100)}% coverage
                    </span>
                  </li>
              )}
              </ul>
            </> :

          <p className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/20 px-3 py-2.5 text-[13px] text-text-primary">
              <Info size={15} className="text-primary mt-0.5 flex-shrink-0" />
              No interventions — this will show the unmitigated outbreak.
            </p>
          }
        </Block>
      </div>
      <p className="text-[11px] text-text-secondary mt-4">Intervention effect sizes are placeholders until an evidence review replaces them.</p>
    </section>);

}