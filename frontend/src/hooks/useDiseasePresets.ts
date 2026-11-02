import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Preset, usePresetMutations, usePresets } from '../api/presets';
import { PresetDraft, PresetFilter, PresetToast } from '../types/presets';
import { BLANK_DRAFT, fromDraft, sameDraft, toDraft, uniqueName, validateDraft } from '../utils/presets';

export const NEW_ID = '__new__';

interface Options {
  /** Grants this user permission to edit built-in presets (the server checks it too). */
  canEditBuiltIns: boolean;
}

export function useDiseasePresets({ canEditBuiltIns }: Options) {
  const { role } = useAuth();
  const query = usePresets();
  const m = usePresetMutations();
  const presets: Preset[] = useMemo(() => query.data ?? [], [query.data]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<PresetFilter>('all');
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<PresetDraft>(BLANK_DRAFT);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<PresetToast[]>([]);
  const toastSeq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Open the first preset once the list arrives.
  useEffect(() => {
    if (selectedId === null && presets.length) {
      setSelectedId(presets[0].id);
      setDraft(toDraft(presets[0]));
    }
  }, [presets, selectedId]);

  // Epidemiologists own presets (rbac.ts: presets=full, disease=full).
  const canCreate = role === 'analyst';
  const canApprove = role === 'analyst';
  const isNew = selectedId === NEW_ID;
  const selected = isNew ? null : presets.find((p) => p.id === selectedId) ?? null;
  const editable = canCreate && (isNew || !!selected && (!selected.builtIn || canEditBuiltIns));
  const baseline = selected ? toDraft(selected) : BLANK_DRAFT;
  const dirty = editable && (isNew || !sameDraft(draft, baseline));
  const errors = useMemo(
    () => editable ? validateDraft(draft, presets, selected?.id ?? null, isNew) : {},
    [draft, presets, selected, editable, isNew]
  );
  const errorCount = Object.keys(errors).length;
  const saving = m.create.isPending || m.update.isPending;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return presets.
    filter((p) => filter === 'builtin' ? p.builtIn : filter === 'custom' ? !p.builtIn : true).
    filter((p) => !q || p.name.toLowerCase().includes(q) || (p.virus ?? '').toLowerCase().includes(q) || p.disease.includes(q)).
    sort((a, b) => Number(b.builtIn) - Number(a.builtIn));
  }, [presets, filter, search]);
  const customCount = presets.filter((p) => !p.builtIn).length;

  const dismissToast = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));
  const pushToast = (tone: PresetToast['tone'], text: string, replaceId?: number) => {
    const id = ++toastSeq.current;
    setToasts((list) => [...list.filter((t) => t.id !== replaceId), { id, tone, text }]);
    if (tone !== 'loading') timers.current.push(window.setTimeout(() => dismissToast(id), 3500));
    return id;
  };
  const failed = (e: unknown, loadingId?: number) =>
  pushToast('error', e instanceof Error ? e.message : 'Something went wrong. Try again.', loadingId);

  const openPreset = (p: Preset) => {
    if (selectedId && selectedId !== NEW_ID) setPreviousId(selectedId);
    setSelectedId(p.id);
    setDraft(toDraft(p));
  };
  const open = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (p) openPreset(p);
  };

  const select = (id: string) => {
    if (id === selectedId) return;
    if (dirty) setPendingId(id);else
    open(id);
  };

  const startNew = (force = false) => {
    if (dirty && !force) {
      setPendingId(NEW_ID);
      return;
    }
    if (selectedId && selectedId !== NEW_ID) setPreviousId(selectedId);
    setSelectedId(NEW_ID);
    setDraft({ ...BLANK_DRAFT, name: uniqueName('New preset', presets) });
    setFilter((f) => f === 'builtin' ? 'all' : f);
  };

  const confirmLeave = () => {
    if (!pendingId) return;
    const id = pendingId;
    setPendingId(null);
    if (id === NEW_ID) startNew(true);else
    open(id);
  };

  const discard = () => {
    if (isNew) {
      const back = presets.find((p) => p.id === previousId) ?? presets[0];
      if (back) openPreset(back);
    } else if (selected) setDraft(toDraft(selected));
  };

  const clone = async (p: Preset) => {
    const loadingId = pushToast('loading', `Cloning “${p.name}”…`);
    try {
      const copy = await m.clone.mutateAsync({ id: p.id, name: uniqueName(`${p.name} (custom)`, presets) });
      openPreset(copy);
      setFilter((f) => f === 'builtin' ? 'all' : f);
      pushToast('success', `Created “${copy.name}”. You can edit it now.`, loadingId);
    } catch (e) {
      failed(e, loadingId);
    }
  };

  const save = async () => {
    if (!dirty || saving) return;
    if (errorCount) {
      pushToast('error', `Fix ${errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} before saving.`);
      return;
    }
    const loadingId = pushToast('loading', 'Saving changes…');
    try {
      const body = fromDraft(draft);
      const saved = isNew ?
      await m.create.mutateAsync({ ...body, disease: draft.disease.trim().toLowerCase() }) :
      await m.update.mutateAsync({ id: selected!.id, body });
      openPreset(saved);
      pushToast('success', isNew ? 'Preset created.' : `Changes saved as version ${saved.version}. It needs a new review.`, loadingId);
    } catch (e) {
      failed(e, loadingId);
    }
  };

  const approve = async (clearProvisional: boolean) => {
    if (!selected) return;
    const loadingId = pushToast('loading', 'Recording your review…');
    try {
      const p = await m.approve.mutateAsync({ id: selected.id, clearProvisional });
      if (!dirty) setDraft(toDraft(p));
      pushToast('success', clearProvisional ? 'Approved. “Provisional” has been cleared.' : 'Approved. The values stay marked provisional.', loadingId);
    } catch (e) {
      failed(e, loadingId);
    }
  };

  return {
    role,
    loading: query.isLoading,
    loadError: query.error instanceof Error ? query.error.message : null,
    presets,
    visible,
    customCount,
    filter,
    setFilter,
    query: search,
    setQuery: setSearch,
    selectedId,
    selected,
    isNew,
    draft,
    setDraft,
    editable,
    canCreate,
    canApprove,
    canEditBuiltIns,
    dirty,
    errors,
    saving,
    approving: m.approve.isPending,
    select,
    startNew: () => startNew(false),
    clone,
    save,
    approve,
    discard,
    pendingId,
    confirmLeave,
    cancelLeave: () => setPendingId(null),
    toasts,
    dismissToast
  };
}

export type DiseasePresetsState = ReturnType<typeof useDiseasePresets>;
