import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Layers, ListTree } from 'lucide-react';
import { useScreenInit } from '../useScreenInit.js';
import { useAuth } from '../context/AuthContext';
import { ViewOnlyBadge } from '../components/analyst/Badges';
import { PresetToasts } from '../components/presets/PresetToasts';
import { TypeLibrary } from '../components/interventionLibrary/TypeLibrary';
import { TypePanel } from '../components/interventionLibrary/TypePanel';
import { PackageList } from '../components/interventionLibrary/PackageList';
import { PackageBuilder } from '../components/interventionLibrary/PackageBuilder';
import { ItemEditor } from '../components/interventionLibrary/ItemEditor';
import { DiscardDialog } from '../components/interventionLibrary/DiscardDialog';
import { useToasts } from '../hooks/useToasts';
import { useInterventionTypes } from '../hooks/useInterventionTypes';
import { useInterventionPackages } from '../hooks/useInterventionPackages';

type Tab = 'types' | 'packages';

interface ScreenState {
  interventionsTab?: Tab;
  interventionTypeId?: string;
  noCustomTypes?: boolean;
  packageId?: string;
  emptyPackage?: boolean;
  itemEditor?: boolean;
}

export function Interventions({ canEditBuiltIns = false }: {canEditBuiltIns?: boolean;}) {
  const init = useScreenInit() as ScreenState;
  const { role } = useAuth();
  // Admins work in the admin area, so only Analysts can edit here.
  const canEdit = role === 'analyst';
  const [tab, setTab] = useState<Tab>(init.interventionsTab ?? 'types');
  const toasts = useToasts();
  const types = useInterventionTypes({
    canEdit,
    canEditBuiltIns,
    toasts,
    initialOpenId: init.interventionTypeId,
    noCustom: init.noCustomTypes
  });
  const packages = useInterventionPackages({
    canEdit,
    toasts,
    initialId: init.packageId,
    emptyPackage: init.emptyPackage,
    openEditor: init.itemEditor
  });
  const editingItem = packages.editor?.itemId ? packages.draft.items.find((i) => i.id === packages.editor?.itemId) ?? null : null;

  const tabs: {id: Tab;label: string;icon: typeof Layers;count: number;}[] = [
  { id: 'types', label: 'Intervention types', icon: ListTree, count: types.types.length },
  { id: 'packages', label: 'Packages', icon: Layers, count: packages.packages.length }];


  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div>
        <p className="text-[13px] text-text-secondary mb-2">Data Management</p>
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-h1 text-text-primary">Interventions</h1>
          {!canEdit && <ViewOnlyBadge />}
        </div>
        <p className="text-body text-text-secondary max-w-3xl">
          Actions that change how a disease spreads, and when they happen. Build packages from intervention types; a scenario then picks one package.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border" role="tablist" aria-label="Interventions sections">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 -mb-px border-b-2 text-[14px] font-semibold flex items-center gap-2 transition-colors ${
              active ? 'border-primary text-text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`
              }>
              
              <Icon size={16} className={active ? 'text-primary' : ''} />
              {t.label}
              <span className="px-1.5 py-0.5 rounded-full bg-surface-2 text-[11px] text-text-secondary">{t.count}</span>
            </button>);

        })}
      </div>

      {tab === 'types' ?
      <TypeLibrary s={types} /> :

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6 items-start">
          <PackageList s={packages} />
          <PackageBuilder s={packages} types={types.types} />
        </div>
      }

      <TypePanel s={types} />

      {packages.editor &&
      createPortal(
        <div className="relative z-[80]">
            <ItemEditor
            key={packages.editor.itemId ?? 'new'}
            types={types.types}
            item={editingItem}
            onSave={packages.upsertItem}
            onCancel={packages.closeEditor} />
          
          </div>,
        document.body
      )}

      {types.confirmPending && <DiscardDialog onKeep={types.cancelDiscard} onDiscard={types.confirmDiscard} />}
      {packages.confirmPending && <DiscardDialog onKeep={packages.cancelDiscard} onDiscard={packages.confirmDiscard} />}

      <PresetToasts toasts={toasts.toasts} onDismiss={toasts.dismiss} />
    </div>);

}