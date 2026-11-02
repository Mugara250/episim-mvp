import { Check } from 'lucide-react';
import { ScenarioRefs } from '../../api/scenarios';
import { ScenarioDraft } from '../../types/scenarios';
import { findDataset, findPackage, findPreset, formatPop } from '../../utils/scenarios';

interface BuilderSummaryProps {
  draft: ScenarioDraft;
  refs: ScenarioRefs;
  seenInterventions: boolean;
  pinnedVersion?: number | null;
}

export function BuilderSummary({ draft, refs, seenInterventions, pinnedVersion }: BuilderSummaryProps) {
  const dataset = findDataset(refs.datasets, draft.datasetId);
  const preset = findPreset(refs.presets, draft.presetId);
  const pkg = findPackage(refs.packages, draft.packageId);
  const items = [
  {
    label: 'Population dataset',
    done: !!dataset,
    value: dataset ? `${dataset.name} - v${pinnedVersion ?? dataset.version}` : 'Required',
    sub: dataset ? `${formatPop(dataset.population)} people` : ''
  },
  {
    label: 'Disease',
    done: !!preset,
    value: preset ? preset.name : 'Required',
    sub: preset ? `R0 ${preset.r0Likely} · ${preset.builtIn ? 'Built-in' : 'Custom'}${preset.provisional ? ' · Provisional' : ''}` : ''
  },
  {
    label: 'Interventions',
    done: seenInterventions,
    value: pkg ? pkg.name : seenInterventions ? 'No interventions' : 'Optional',
    sub: pkg ? `${pkg.items.length} interventions` : ''
  },
  { label: 'Name', done: !!draft.name.trim(), value: draft.name.trim() || 'Not named yet', sub: draft.visibility === 'institution' ? 'Shared with institution' : 'Private' }];


  return (
    <aside className="bg-surface rounded-xl border border-border p-5 lg:sticky lg:top-0" aria-label="Scenario summary">
      <h2 className="text-[14px] font-semibold text-text-primary">Scenario summary</h2>
      <ol className="mt-4 space-y-4">
        {items.map((it) =>
        <li key={it.label} className="flex gap-3">
            <span
            className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
            it.done ? 'bg-primary text-white' : 'border border-border'}`
            }
            aria-hidden>
            
              {it.done && <Check size={11} strokeWidth={3} />}
            </span>
            <div className="min-w-0">
              <p className="text-[11px] text-text-secondary">{it.label}</p>
              <p className={`text-[13px] break-words ${it.done ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>{it.value}</p>
              {it.sub && <p className="text-[12px] text-text-secondary">{it.sub}</p>}
            </div>
          </li>
        )}
      </ol>
      <p className="mt-5 pt-4 border-t border-border text-[12px] text-text-secondary">Model: stochastic SEIHFR. National or geographic is chosen when you run it.</p>
    </aside>);

}