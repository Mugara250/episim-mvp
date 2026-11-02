import React from 'react';
import { Lock } from 'lucide-react';
import { DiseasePreset } from '../../types/presets';
import { pct } from '../../utils/scenarios';
import { ChoiceCard } from './ChoiceCard';
import { ConfigEmpty } from './ConfigEmpty';

interface DiseaseStepProps {
  presets: DiseasePreset[];
  value: string | null;
  onChange: (id: string) => void;
  onOpenPresets?: () => void;
}

const FOCUS = ['ebola-zaire', 'marburg'];

export function DiseaseStep({ presets, value, onChange, onOpenPresets }: DiseaseStepProps) {
  const ordered = [...presets].sort((a, b) => {
    const ra = FOCUS.indexOf(a.id);
    const rb = FOCUS.indexOf(b.id);
    return (ra === -1 ? 99 : ra) - (rb === -1 ? 99 : rb);
  });
  return (
    <div>
      <h2 className="text-h2 text-text-primary">Choose a disease</h2>
      <p className="text-[13px] text-text-secondary mt-1">How the disease behaves. Values come from Disease Presets and can’t be changed here.</p>

      <div className="mt-6">
        {ordered.length === 0 ?
        <ConfigEmpty
          title="No disease presets yet"
          text="Add a disease on the Disease Presets page, then come back to build a scenario."
          linkLabel={onOpenPresets ? 'Go to Disease Presets' : undefined}
          onLink={onOpenPresets} /> :


        <div role="radiogroup" aria-label="Disease" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {ordered.map((p) =>
          <ChoiceCard key={p.id} selected={value === p.id} onSelect={() => onChange(p.id)}>
                <span className="flex items-center gap-2 pr-8 flex-wrap">
                  <span className="text-[15px] font-semibold text-text-primary">{p.name}</span>
                  {p.builtIn ?
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-surface-2 text-text-secondary">
                      <Lock size={10} /> Built-in
                    </span> :

              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-primary/15 text-primary">Custom</span>
              }
                </span>
                <dl className="grid grid-cols-4 gap-3 mt-4 mb-4">
                  {[
              ['R0', p.r0.toString()],
              ['Incubation', `${p.incubationDays} d`],
              ['Infectious', `${p.infectiousDays} d`],
              ['Fatality', pct(p.mortality)]].
              map(([k, v]) =>
              <div key={k}>
                      <dt className="text-[11px] text-text-secondary">{k}</dt>
                      <dd className="text-[15px] font-bold text-text-primary tabular-nums">{v}</dd>
                    </div>
              )}
                </dl>
                <p className="text-[12px] text-text-secondary pt-3 border-t border-border line-clamp-2 mt-auto">
                  {p.source || 'No source recorded.'}
                </p>
              </ChoiceCard>
          )}
          </div>
        }
        {ordered.length > 0 && <p className="text-[12px] text-text-secondary mt-4">Values are illustrative placeholders.</p>}
      </div>
    </div>);

}