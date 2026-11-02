import { ArrowLeft, ArrowRight, ChevronRight, Lock } from 'lucide-react';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { CheckStep } from '../components/populationImport/CheckStep';
import { DetailsStep } from '../components/populationImport/DetailsStep';
import { ImportStepper } from '../components/populationImport/ImportStepper';
import { ReviewStep } from '../components/populationImport/ReviewStep';
import { UploadStep } from '../components/populationImport/UploadStep';
import { useAuth } from '../context/AuthContext';
import { useImportJob } from '../context/ImportJobContext';
import { STEPS, usePopulationImport } from '../hooks/usePopulationImport';

const STEP_INTRO = [
'Upload a CSV from the NISR census or another population source.',
'We look at your file, match its columns to EpiSim and check every row.',
'Describe the dataset so others can find it when building scenarios.',
'Confirm everything looks right, then start the import.'];


export function PopulationImport({ onNavigate }: {onNavigate: (route: string) => void;}) {
  const { role } = useAuth();
  const { retry, computeAggregates } = useImportJob();
  const s = usePopulationImport();
  const canImport = role === 'analyst' || role === 'admin';
  const readOnly = !canImport;
  const jobActive = s.job.status !== 'idle';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <div>
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-[13px] mb-3">
          <button onClick={() => onNavigate('/population')} className="text-text-secondary hover:text-primary transition-colors">
            Population Data
          </button>
          <ChevronRight size={13} className="text-text-secondary" />
          <span className="text-text-primary font-medium" aria-current="page">
            Import dataset
          </span>
        </nav>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Import population data</h1>
          {readOnly && <ViewOnlyBadge />}
        </div>
        <p className="text-body text-text-secondary">{jobActive ? 'Your import is running. Progress updates below.' : STEP_INTRO[s.step]}</p>
      </div>

      {readOnly &&
      <div role="note" className="flex items-start gap-3 bg-surface border border-border rounded-xl px-5 py-4">
          <Lock size={16} className="text-text-secondary mt-0.5 flex-shrink-0" />
          <p className="text-[13px] text-text-secondary">
            <span className="font-semibold text-text-primary">Only Epidemiologists and Administrators can import population data.</span> You can
            look at how importing works, but not upload files. If you need to add a dataset, ask an Epidemiologist or your administrator.
          </p>
        </div>
      }

      <ImportStepper steps={STEPS} current={jobActive ? 4 : s.step} onSelect={s.setStep} locked={readOnly || jobActive} />

      {s.step === 0 && <UploadStep s={s} readOnly={readOnly} />}
      {s.step === 1 && <CheckStep s={s} readOnly={readOnly} />}
      {s.step === 2 && <DetailsStep s={s} readOnly={readOnly} />}
      {s.step === 3 &&
      <ReviewStep
        s={s}
        readOnly={readOnly}
        onRetry={retry}
        onComputeAggregates={computeAggregates}
        onViewDataset={() => onNavigate('/population')} />

      }

      {!readOnly && !jobActive &&
      <div className="flex items-center justify-between pt-2">
          {s.step > 0 ?
        <button
          onClick={s.back}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors">
          
              <ArrowLeft size={15} /> Back
            </button> :

        <button
          onClick={() => onNavigate('/population')}
          className="px-4 py-2.5 rounded-lg text-[13px] font-semibold text-text-secondary hover:text-text-primary transition-colors">
          
              Cancel
            </button>
        }
          {s.step < 3 &&
        <button
          onClick={s.next}
          disabled={!s.canContinue && s.step !== 2}
          className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          
              {s.step === 2 ? 'Review' : 'Continue'} <ArrowRight size={15} />
            </button>
        }
        </div>
      }
    </div>);

}