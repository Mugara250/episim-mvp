import { Lock } from 'lucide-react';
import { PopulationDataset } from '../../types/scenarios';
import { dateLabel, formatPop } from '../../utils/scenarios';
import { ChoiceCard } from './ChoiceCard';
import { ConfigEmpty } from './ConfigEmpty';

interface DatasetStepProps {
  datasets: PopulationDataset[];
  value: string | null;
  onChange: (id: string) => void;
  onImport?: () => void;
}

export function DatasetStep({ datasets, value, onChange, onImport }: DatasetStepProps) {
  return (
    <div>
      <h2 className="text-h2 text-text-primary">Choose a population dataset</h2>
      <p className="text-[13px] text-text-secondary mt-1">Who lives where. The simulation spreads the disease through this population.</p>
      <p className="mt-4 flex items-start gap-2 rounded-lg bg-background border border-border px-3 py-2.5 text-[13px] text-text-primary">
        <Lock size={14} className="text-primary mt-0.5 flex-shrink-0" />
        The version is locked when you save, so re-running this scenario later always uses the same census data even if the dataset is updated.
      </p>

      <div className="mt-6">
        {datasets.length === 0 ?
        <ConfigEmpty
          title="No population datasets yet"
          text={onImport ? 'Import census data on the Population Data page, then come back to build a scenario.' : 'An Epidemiologist needs to import census data before scenarios can be built.'}
          linkLabel={onImport ? 'Go to Population Data' : undefined}
          onLink={onImport} /> :


        <div role="radiogroup" aria-label="Population dataset" className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {datasets.map((d) =>
          <ChoiceCard key={d.id} selected={value === d.id} onSelect={() => onChange(d.id)}>
                <span className="flex items-center gap-2 pr-8 flex-wrap">
                  <span className="text-[15px] font-semibold text-text-primary">{d.name}</span>
                  {d.illustrative && <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-warning/15 text-warning">Illustrative</span>}
                </span>
                <span className="text-[12px] text-text-secondary mt-0.5 mb-4">{d.coverage}</span>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 pt-4 border-t border-border mt-auto">
                  <div>
                    <dt className="text-[11px] text-text-secondary">Total population</dt>
                    <dd className="text-[16px] font-bold text-text-primary tabular-nums">{formatPop(d.population)}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Version</dt>
                    <dd className="text-[16px] font-bold text-text-primary">v{d.version}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Source</dt>
                    <dd className="text-[12px] text-text-primary">{d.source}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-text-secondary">Last imported</dt>
                    <dd className="text-[12px] text-text-primary tabular-nums">{dateLabel(d.lastImported)}</dd>
                  </div>
                </dl>
              </ChoiceCard>
          )}
          </div>
        }
        {datasets.length > 0 && <p className="text-[12px] text-text-secondary mt-4">Datasets marked Illustrative are sample figures for the demo, not verified census extracts.</p>}
      </div>
    </div>);

}