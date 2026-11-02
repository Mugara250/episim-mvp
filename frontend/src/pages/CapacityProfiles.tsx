import { Building2, Info, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { ProfileList } from '../components/capacity/ProfileList';
import { ProfileDetail } from '../components/capacity/ProfileDetail';
import { PresetToasts } from '../components/presets/PresetToasts';
import { DiscardDialog } from '../components/interventionLibrary/DiscardDialog';
import { useCapacityProfiles } from '../hooks/useCapacityProfiles';

export function CapacityProfiles() {
  const { role, user } = useAuth();
  const s = useCapacityProfiles({ role, institutionId: user?.institutionId ?? null });
  const hasSelection = s.isNew || !!s.selected;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-[13px] text-text-secondary mb-2">Data Management</p>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Healthcare Capacity</h1>
          {!s.canCreate && <ViewOnlyBadge />}
        </div>
        <p className="text-body text-text-secondary max-w-3xl">
          The health resources that actually exist in a region or hospital: beds, staff, testing and vaccines.
        </p>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface px-5 py-4">
        <Info size={18} className="text-primary mt-0.5 flex-shrink-0" />
        <p className="text-[13px] text-text-primary">
          Capacity profiles are used to check simulation results against real resources. They don’t affect how the outbreak is modelled.
        </p>
      </div>

      {s.loadError ?
      <p role="alert" className="bg-danger/10 border border-danger/30 rounded-xl px-5 py-4 text-[13px] text-text-primary">
          Capacity profiles couldn’t be loaded. {s.loadError}
        </p> :
      s.loading ?
      <p className="bg-surface border border-border rounded-xl px-5 py-8 text-[13px] text-text-secondary">Loading capacity profiles…</p> :
      s.profiles.length === 0 && !s.isNew ?
      <div className="bg-surface rounded-xl border-2 border-dashed border-border px-6 py-20 text-center">
          <span className="w-14 h-14 rounded-full bg-hover flex items-center justify-center mx-auto mb-4">
            <Building2 size={22} className="text-primary" />
          </span>
          <h2 className="text-h3 text-text-primary">Create your first capacity profile</h2>
          <p className="text-[13px] text-text-secondary mt-1 max-w-md mx-auto">
            {s.canCreate ?
          'Record the beds, staff and testing available so EpiSim can warn when simulation results need more than you have.' :
          'No capacity profiles have been recorded yet. Public Health Officers create them for their institution.'}
          </p>
          {s.canCreate &&
        <button
          onClick={s.startNew}
          className="mt-6 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold inline-flex items-center gap-2 transition-colors">
          
              <Plus size={15} /> New capacity profile
            </button>
        }
        </div> :

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <ProfileList s={s} />
          {hasSelection ?
        <ProfileDetail s={s} /> :

        <div className="bg-surface rounded-xl border border-border px-6 py-16 text-center text-[13px] text-text-secondary">Choose a profile to see its details.</div>
        }
        </div>
      }

      {s.confirmPending && <DiscardDialog onKeep={s.cancelDiscard} onDiscard={s.confirmDiscard} />}
      <PresetToasts toasts={s.toasts.toasts} onDismiss={s.toasts.dismiss} />
    </div>);

}