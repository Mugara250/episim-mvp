import { Ban } from 'lucide-react';
import { InterventionTypeRef, PackageRef } from '../../types/scenarios';
import { ChoiceCard } from './ChoiceCard';
import { ConfigEmpty } from './ConfigEmpty';
import { MiniTimeline } from './MiniTimeline';

interface PackageStepProps {
  packages: PackageRef[];
  types: InterventionTypeRef[];
  value: string | null;
  seen: boolean;
  onChange: (id: string) => void;
  onSkip: () => void;
  onOpenInterventions?: () => void;
}

export function PackageStep({ packages, types, value, seen, onChange, onSkip, onOpenInterventions }: PackageStepProps) {
  const skipped = seen && value === null;
  return (
    <div>
      <h2 className="text-h2 text-text-primary">
        Add interventions <span className="text-text-secondary font-normal text-[15px]">· Optional</span>
      </h2>
      <p className="text-[13px] text-text-secondary mt-1">Pick a package of response actions, built on the Interventions page.</p>

      <button
        type="button"
        onClick={onSkip}
        aria-pressed={skipped}
        className={`mt-6 w-full flex items-center gap-4 rounded-xl border-2 border-dashed px-5 py-4 text-left transition-colors ${
        skipped ? 'border-primary bg-hover' : 'border-border hover:border-primary/40'}`
        }>
        
        <span className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center flex-shrink-0">
          <Ban size={18} className="text-text-secondary" />
        </span>
        <span className="flex-1">
          <span className="block text-[14px] font-semibold text-text-primary">Skip - no interventions</span>
          <span className="block text-[13px] text-text-secondary">Skip this to see how the outbreak would unfold with no response.</span>
        </span>
      </button>

      <div className="mt-4">
        {packages.length === 0 ?
        <ConfigEmpty
          title="No intervention packages yet"
          text="Build a package on the Interventions page, or skip this step for now."
          linkLabel={onOpenInterventions ? 'Go to Interventions' : undefined}
          onLink={onOpenInterventions} /> :


        <div role="radiogroup" aria-label="Intervention package" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {packages.map((p) =>
          <ChoiceCard key={p.id} selected={value === p.id} onSelect={() => onChange(p.id)}>
                <span className="flex items-center gap-2 pr-8 flex-wrap">
                  <span className="text-[15px] font-semibold text-text-primary">{p.name}</span>
                  {p.illustrative && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Illustrative</span>}
                </span>
                <span className="text-[12px] text-text-secondary mt-0.5">
                  {p.items.length} intervention{p.items.length === 1 ? '' : 's'}
                </span>
                {p.description && <span className="text-[13px] text-text-secondary mt-2 line-clamp-2">{p.description}</span>}
                <div className="mt-auto pt-4">
                  {p.items.length ? <MiniTimeline pkg={p} types={types} /> : <p className="text-[12px] text-text-secondary">This package is empty.</p>}
                </div>
              </ChoiceCard>
          )}
          </div>
        }
      </div>
    </div>);

}