import React from 'react';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { PresetDetail } from '../components/presets/PresetDetail';
import { PresetLibrary } from '../components/presets/PresetLibrary';
import { PresetToasts } from '../components/presets/PresetToasts';
import { useDiseasePresets } from '../hooks/useDiseasePresets';
import { hasAccess } from '../lib/rbac';

interface DiseasePresetsProps {
  onNavigate: (route: string) => void;
  canEditBuiltIns?: boolean;
}

export function DiseasePresets({ onNavigate, canEditBuiltIns = false }: DiseasePresetsProps) {
  const s = useDiseasePresets({ canEditBuiltIns });
  const canStartScenario = hasAccess(s.role, 'simulation');

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-[13px] text-text-secondary mb-2">Data Management</p>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Disease Presets</h1>
          {!s.canCreate && <ViewOnlyBadge />}
        </div>
        <p className="text-body text-text-secondary max-w-3xl">
          How each disease behaves on its own, separate from any population. A scenario picks one preset, so the same values can be reused.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        <PresetLibrary s={s} />
        <PresetDetail s={s} canStartScenario={canStartScenario} onUseInScenario={() => onNavigate('/simulation')} />
      </div>

      {s.pendingId &&
      <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="leave-title">
          <div className="bg-surface border border-border rounded-xl p-6 w-full max-w-md shadow-card">
            <h2 id="leave-title" className="text-h3 text-text-primary">
              Discard unsaved changes?
            </h2>
            <p className="text-[13px] text-text-secondary mt-2">Your changes to “{s.draft.name || 'this preset'}” haven’t been saved and will be lost.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
              onClick={s.cancelLeave}
              autoFocus
              className="px-4 py-2.5 rounded-lg border border-border text-[13px] font-semibold text-text-primary hover:border-primary/40 transition-colors">
              
                Keep editing
              </button>
              <button
              onClick={s.confirmLeave}
              className="px-4 py-2.5 rounded-lg bg-danger text-white text-[13px] font-semibold hover:opacity-90 transition-opacity">
              
                Discard changes
              </button>
            </div>
          </div>
        </div>
      }

      <PresetToasts toasts={s.toasts} onDismiss={s.dismissToast} />
    </div>);

}