import { useEffect, useMemo, useState } from 'react';
import { useInterventionMutations, usePackagesQuery } from '../api/interventions';
import { InterventionPackage, PackageItem } from '../types/interventions';
import { fromApiPackage, samePackage, todayLabel, uniqueName } from '../utils/interventions';
import { Toasts } from './useToasts';

export const NEW_PACKAGE = '__new_package__';

const EMPTY: InterventionPackage = { id: '', name: '', description: '', items: [], updated: '' };

interface Options {
  canEdit: boolean;
  toasts: Toasts;
  initialId?: string;
}

export function useInterventionPackages({ canEdit, toasts, initialId }: Options) {
  const query = usePackagesQuery();
  const m = useInterventionMutations();
  const packages: InterventionPackage[] = useMemo(() => (query.data ?? []).map(fromApiPackage), [query.data]);
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const [draft, setDraft] = useState<InterventionPackage>(EMPTY);
  const [editor, setEditor] = useState<{itemId: string | null;} | null>(null);
  const [confirm, setConfirm] = useState<null | (() => void)>(null);

  // Open the first (or deep-linked) package once the list arrives.
  useEffect(() => {
    if (draft !== EMPTY || !packages.length) return;
    const p = packages.find((x) => x.id === selectedId) ?? packages[0];
    setSelectedId(p.id);
    setDraft(p);
  }, [packages, selectedId, draft]);

  const isNew = selectedId === NEW_PACKAGE;
  const saved = packages.find((p) => p.id === selectedId);
  const dirty = canEdit && (isNew || !!saved && !samePackage(draft, saved));
  const saving = m.createPackage.isPending || m.updatePackage.isPending;
  const nameError =
  canEdit && !draft.name.trim() ?
  'Give the package a name.' :
  canEdit && packages.some((p) => p.id !== draft.id && p.name.trim().toLowerCase() === draft.name.trim().toLowerCase()) ?
  'Another package already has this name.' :
  '';

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
      setSelectedId(p?.id ?? null);
      setDraft(p ?? EMPTY);
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

  const save = async () => {
    if (!dirty || saving) return;
    if (nameError) {
      toasts.push('error', 'Fix the package name before saving.');
      return;
    }
    const loading = toasts.push('loading', 'Saving package…');
    const body = {
      name: draft.name.trim(),
      description: draft.description.trim(),
      items: draft.items.map((i) => ({
        typeId: i.typeId,
        startDay: i.startDay,
        endDay: i.endDay,
        coverage: i.coverage,
        customEffect: i.customEffect
      }))
    };
    try {
      const res = isNew ? await m.createPackage.mutateAsync(body) : await m.updatePackage.mutateAsync({ id: draft.id, body });
      const next = fromApiPackage(res);
      setSelectedId(next.id);
      setDraft(next);
      toasts.push('success', isNew ? 'Package created.' : 'Package saved.', loading);
    } catch (e) {
      toasts.push('error', e instanceof Error ? e.message : 'The package couldn’t be saved.', loading);
    }
  };

  return {
    loading: query.isLoading,
    loadError: query.error instanceof Error ? query.error.message : null,
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
