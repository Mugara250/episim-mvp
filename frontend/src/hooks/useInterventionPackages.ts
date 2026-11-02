import { useState } from 'react';
import { interventionPackages } from '../data/interventions';
import { InterventionPackage, PackageItem } from '../types/interventions';
import { samePackage, todayLabel, uniqueName } from '../utils/interventions';
import { Toasts } from './useToasts';

export const NEW_PACKAGE = '__new_package__';

interface Options {
  canEdit: boolean;
  toasts: Toasts;
  initialId?: string;
  emptyPackage?: boolean;
  openEditor?: boolean;
}

export function useInterventionPackages({ canEdit, toasts, initialId, emptyPackage, openEditor }: Options) {
  const [packages, setPackages] = useState<InterventionPackage[]>(() =>
  emptyPackage ?
  [...interventionPackages, { id: 'pkg-empty', name: 'Marburg health-facility response', description: '', items: [], updated: '08 Oct 2026' }] :
  interventionPackages
  );
  const firstId = emptyPackage ? 'pkg-empty' : initialId ?? packages[0]?.id;
  const [selectedId, setSelectedId] = useState<string>(firstId);
  const initialPkg = packages.find((p) => p.id === firstId) ?? packages[0];
  const [draft, setDraft] = useState<InterventionPackage>(initialPkg);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<{itemId: string | null;} | null>(openEditor && canEdit ? { itemId: null } : null);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  const isNew = selectedId === NEW_PACKAGE;
  const saved = packages.find((p) => p.id === selectedId);
  const dirty = canEdit && (isNew || !!saved && !samePackage(draft, saved));
  const nameError = canEdit && !draft.name.trim() ? 'Give the package a name.' : canEdit && packages.some((p) => p.id !== draft.id && p.name.trim().toLowerCase() === draft.name.trim().toLowerCase()) ? 'Another package already has this name.' : '';

  const guard = (fn: () => void) => dirty ? setConfirm(() => fn) : fn();

  const select = (id: string) => {
    if (id === selectedId) return;
    guard(() => {
      const p = packages.find((x) => x.id === id);
      if (!p) return;
      setSelectedId(id);
      setDraft(p);
      setEditor(null);
    });
  };

  const startNew = () =>
  guard(() => {
    setSelectedId(NEW_PACKAGE);
    setDraft({ id: NEW_PACKAGE, name: uniqueName('New package', packages.map((p) => p.name)), description: '', items: [], updated: todayLabel() });
    setEditor(null);
  });

  const confirmDiscard = () => {
    const fn = confirm;
    setConfirm(null);
    fn?.();
  };

  const discard = () => {
    if (isNew) {
      const p = packages[0];
      setSelectedId(p.id);
      setDraft(p);
    } else if (saved) setDraft(saved);
    setEditor(null);
  };

  const upsertItem = (item: PackageItem) => {
    setDraft((d) => {
      const exists = d.items.some((i) => i.id === item.id);
      return { ...d, items: exists ? d.items.map((i) => i.id === item.id ? item : i) : [...d.items, item] };
    });
    setEditor(null);
  };

  const removeItem = (id: string) => setDraft((d) => ({ ...d, items: d.items.filter((i) => i.id !== id) }));

  const save = () => {
    if (!dirty || saving) return;
    if (nameError) {
      toasts.push('error', 'Fix the package name before saving.');
      return;
    }
    setSaving(true);
    const loading = toasts.push('loading', 'Saving package…');
    toasts.later(() => {
      const next: InterventionPackage = { ...draft, name: draft.name.trim(), description: draft.description.trim(), updated: todayLabel() };
      if (isNew) {
        next.id = `pkg-${Date.now()}`;
        setPackages((list) => [...list, next]);
        setSelectedId(next.id);
      } else {
        setPackages((list) => list.map((p) => p.id === next.id ? next : p));
      }
      setDraft(next);
      setSaving(false);
      toasts.push('success', isNew ? 'Package created.' : 'Package saved.', loading);
    }, 700);
  };

  return {
    packages,
    selectedId,
    isNew,
    draft,
    setDraft,
    nameError,
    dirty,
    saving,
    canEdit,
    select,
    startNew,
    save,
    discard,
    editor,
    openEditor: (itemId: string | null) => setEditor({ itemId }),
    closeEditor: () => setEditor(null),
    upsertItem,
    removeItem,
    confirmPending: !!confirm,
    confirmDiscard,
    cancelDiscard: () => setConfirm(null)
  };
}

export type InterventionPackagesState = ReturnType<typeof useInterventionPackages>;