import React from 'react';
import { ArrowLeft, ArrowRight, Copy, Info, Loader2, PlayCircle, Save } from 'lucide-react';
import { InterventionPackage, InterventionType } from '../../types/interventions';
import { DiseasePreset } from '../../types/presets';
import { PopulationDataset } from '../../types/scenarios';
import { BUILDER_STEPS, BuilderState } from '../../hooks/useScenarioBuilder';
import { ImportStepper } from '../populationImport/ImportStepper';
import { BuilderSummary } from './BuilderSummary';
import { DatasetStep } from './DatasetStep';
import { DiseaseStep } from './DiseaseStep';
import { PackageStep } from './PackageStep';
import { NameReviewStep } from './NameReviewStep';

interface ScenarioBuilderProps {
  b: BuilderState;
  datasets: PopulationDataset[];
  presets: DiseasePreset[];
  packages: InterventionPackage[];
  types: InterventionType[];
  institution: string;
  canClone: boolean;
  canRun: boolean;
  onClose: () => void;
  onClone: () => void;
  onRun: () => void;
  link: (route: string) => (() => void) | undefined;
}

const secondaryBtn =
'px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap';
const primaryBtn =
'bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 whitespace-nowrap transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

export function ScenarioBuilder({ b, datasets, presets, packages, types, institution, canClone, canRun, onClose, onClone, onRun, link }: ScenarioBuilderProps) {
  const { draft, step, readOnly, mode, base } = b;
  const set = (patch: Partial<typeof draft>) => b.setDraft({ ...draft, ...patch });
  const pinned = mode.kind === 'view' || mode.kind === 'draft' ? base?.datasetVersion : null;
  const title =
  mode.kind === 'view' ? base?.name ?? 'Scenario' : mode.kind === 'clone' ? 'Clone scenario' : mode.kind === 'draft' ? 'Finish draft' : 'New scenario';
  const busy = b.saving !== null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <nav aria-label="Breadcrumb" className="text-[13px] text-text-secondary mb-2">
          <button onClick={onClose} className="hover:text-primary hover:underline">Scenarios</button>
          <span className="mx-1.5">/</span>
          <span className="text-text-primary">{title}</span>
        </nav>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-h1 text-text-primary">{title}</h1>
          <button onClick={onClose} className="flex items-center gap-1.5 text-[13px] font-semibold text-text-secondary hover:text-primary">
            <ArrowLeft size={15} /> Back to library
          </button>
        </div>
        {base && (mode.kind === 'clone' || mode.kind === 'view') &&
        <p className="mt-3 flex items-start gap-2 text-[13px] text-text-secondary">
            <Info size={15} className="mt-0.5 flex-shrink-0 text-primary" />
            {mode.kind === 'clone' ? `Copying “${base.name}”. ` : ''}Scenarios can’t be edited once saved. Clone to make changes.
          </p>
        }
      </div>

      {!readOnly && <ImportStepper steps={BUILDER_STEPS} current={step} onSelect={(i) => b.goTo(i)} />}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">
        <section className="bg-surface rounded-xl border border-border min-w-0">
          <div className="p-6 md:p-8">
            {step === 0 && <DatasetStep datasets={datasets} value={draft.datasetId} onChange={(id) => set({ datasetId: id })} onImport={link('/population')} />}
            {step === 1 && <DiseaseStep presets={presets} value={draft.presetId} onChange={(id) => set({ presetId: id })} onOpenPresets={link('/presets')} />}
            {step === 2 &&
            <PackageStep
              packages={packages}
              types={types}
              value={draft.packageId}
              seen={b.seenInterventions}
              onChange={(id) => set({ packageId: id })}
              onSkip={b.skipInterventions}
              onOpenInterventions={link('/interventions')} />

            }
            {step === 3 &&
            <NameReviewStep
              draft={draft}
              onChange={set}
              errors={b.errors}
              readOnly={readOnly}
              institution={institution}
              types={types}
              pinnedVersion={pinned}
              onEdit={b.goTo} />

            }
          </div>

          <div className="px-6 md:px-8 py-4 border-t border-border flex flex-wrap items-center gap-3">
            {readOnly ?
            <>
                <button onClick={onClose} className={secondaryBtn}>
                  <ArrowLeft size={15} /> Back
                </button>
                <div className="ml-auto flex flex-wrap gap-3">
                  {canClone &&
                <button onClick={onClone} className={secondaryBtn}>
                      <Copy size={15} /> Clone
                    </button>
                }
                  {canRun &&
                <button onClick={onRun} className={primaryBtn}>
                      <PlayCircle size={15} /> Run simulation
                    </button>
                }
                </div>
              </> :

            <>
                <button onClick={b.back} disabled={step === 0 || busy} className={secondaryBtn}>
                  <ArrowLeft size={15} /> Back
                </button>
                <button onClick={() => b.save('draft')} disabled={busy} className="px-3 py-2.5 text-[13px] font-semibold text-primary hover:underline disabled:opacity-40 flex items-center gap-1.5">
                  {b.saving === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save draft
                </button>
                <div className="ml-auto flex flex-wrap gap-3">
                  {step < 3 ?
                <button
                  onClick={b.next}
                  disabled={!b.canNext}
                  title={!b.canNext ? step === 0 ? 'Choose a population dataset first' : 'Choose a disease first' : undefined}
                  className={primaryBtn}>
                  
                      Next <ArrowRight size={15} />
                    </button> :

                <>
                      <button onClick={() => b.save('save')} disabled={busy} className={secondaryBtn}>
                        {b.saving === 'save' && <Loader2 size={14} className="animate-spin" />} Save scenario
                      </button>
                      {canRun &&
                  <button onClick={() => b.save('run')} disabled={busy} className={primaryBtn}>
                          {b.saving === 'run' ? <Loader2 size={14} className="animate-spin" /> : <PlayCircle size={15} />} Save and run simulation
                        </button>
                  }
                    </>
                }
                </div>
              </>
            }
          </div>
        </section>

        <BuilderSummary draft={draft} seenInterventions={b.seenInterventions} pinnedVersion={pinned} />
      </div>
    </div>);

}