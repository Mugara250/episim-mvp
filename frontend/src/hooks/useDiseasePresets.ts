import { useEffect, useMemo, useRef, useState } from 'react';
import { useScreenInit } from '../useScreenInit.js';
import { useAuth } from '../context/AuthContext';
import { diseasePresets, ROUTE_LABELS } from '../data/diseasePresets';
import { DiseasePreset, PresetDraft, PresetFilter, PresetToast } from '../types/presets';
import { BLANK_DRAFT, fromDraft, sameDraft, toDraft, todayLabel, uniqueName, validateDraft } from '../utils/presets';

export const NEW_ID = '__new__';

interface Options {
  /** Grants this user permission to edit built-in presets. */
  canEditBuiltIns: boolean;
}

export function useDiseasePresets({ canEditBuiltIns }: Options) {
  const { role } = useAuth();
  const init = useScreenInit() as {presetId?: string;presetFilter?: PresetFilter;presetsNoCustom?: boolean;};

  const [presets, setPresets] = useState<DiseasePreset[]>(() =>
  init.presetsNoCustom ? diseasePresets.filter((p) => p.builtIn) : diseasePresets
  );
  const [selectedId, setSelectedId] = useState<string>(init.presetId ?? 'ebola-zaire');
  const [filter, setFilter] = useState<PresetFilter>(init.presetFilter ?? 'all');
  const [query, setQuery] = useState('');
  const initial = presets.find((p) => p.id === selectedId) ?? presets[0];
  const [draft, setDraft] = useState<PresetDraft>(toDraft(initial));
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [previousId, setPreviousId] = useState<string>(initial.id);
  const [toasts, setToasts] = useState<PresetToast[]>([]);
  const toastSeq = useRef(0);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  // Analysts own custom presets; Admins work in the admin area, so granted permission covers built-ins here.
  const canCreate = role === 'analyst';
  const isNew = selectedId === NEW_ID;
  const selected = isNew ? null : presets.find((p) => p.id === selectedId) ?? null;
  const editable = canCreate && (isNew || !!selected && (!selected.builtIn || canEditBuiltIns));
  const baseline = selected ? toDraft(selected) : BLANK_DRAFT;
  const dirty = editable && (isNew || !sameDraft(draft, baseline));
  const errors = useMemo(() => editable ? validateDraft(draft, presets, selected?.id ?? null) : {}, [draft, presets, selected, editable]);
  const errorCount = Object.keys(errors).length;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return presets.
    filter((p) => filter === 'builtin' ? p.builtIn : filter === 'custom' ? !p.builtIn : true).
    filter((p) => !q || p.name.toLowerCase().includes(q) || ROUTE_LABELS[p.route].toLowerCase().includes(q)).
    sort((a, b) => Number(b.builtIn) - Number(a.builtIn));
  }, [presets, filter, query]);
  const customCount = presets.filter((p) => !p.builtIn).length;

  const pushToast = (tone: PresetToast['tone'], text: string, replaceId?: number) => {
    const id = ++toastSeq.current;
    setToasts((list) => [...list.filter((t) => t.id !== replaceId), { id, tone, text }]);
    if (tone !== 'loading') timers.current.push(window.setTimeout(() => dismissToast(id), 3500));
    return id;
  };
  const dismissToast = (id: number) => setToasts((list) => list.filter((t) => t.id !== id));

  const open = (id: string) => {
    const p = presets.find((x) => x.id === id);
    if (!p) return;
    if (selectedId !== NEW_ID) setPreviousId(selectedId);
    setSelectedId(id);
    setDraft(toDraft(p));
  };

  const select = (id: string) => {
    if (id === selectedId) return;
    if (dirty) setPendingId(id);else
    open(id);
  };

  const confirmLeave = () => {
    if (!pendingId) return;
    const id = pendingId;
    setPendingId(null);
    if (id === NEW_ID) startNew(true);else
    open(id);
  };

  const discard = () => {
    if (isNew) open(previousId);else
    if (selected) setDraft(toDraft(selected));
  };

  const startNew = (force = false) => {
    if (dirty && !force) {
      setPendingId(NEW_ID);
      return;
    }
    if (selectedId !== NEW_ID) setPreviousId(selectedId);
    setSelectedId(NEW_ID);
    setDraft({ ...BLANK_DRAFT, name: uniqueName('New preset', presets) });
    setFilter((f) => f === 'builtin' ? 'all' : f);
  };

  const clone = (p: DiseasePreset) => {
    const copy: DiseasePreset = {
      ...p,
      id: `custom-${Date.now()}`,
      name: uniqueName(`${p.name} (custom)`, presets),
      description: `Custom copy of ${p.name}. Adjust the values to match your setting.`,
      builtIn: false,
      updated: todayLabel()
    };
    setPresets((list) => [...list, copy]);
    setPreviousId(copy.id);
    setSelectedId(copy.id);
    setDraft(toDraft(copy));
    setFilter((f) => f === 'builtin' ? 'all' : f);
    pushToast('success', `Created “${copy.name}”. You can edit it now.`);
  };

  const save = () => {
    if (!dirty || saving) return;
    if (errorCount) {
      pushToast('error', `Fix ${errorCount === 1 ? 'the highlighted field' : `the ${errorCount} highlighted fields`} before saving.`);
      return;
    }
    setSaving(true);
    const loadingId = pushToast('loading', 'Saving changes…');
    timers.current.push(
      window.setTimeout(() => {
        const values = fromDraft(draft);
        if (isNew) {
          const created: DiseasePreset = {
            id: `custom-${Date.now()}`,
            description: 'Custom preset.',
            builtIn: false,
            placeholder: false,
            updated: todayLabel(),
            ...values
          };
          setPresets((list) => [...list, created]);
          setPreviousId(created.id);
          setSelectedId(created.id);
          setDraft(toDraft(created));
        } else if (selected) {
          const updated = { ...selected, ...values, placeholder: false, updated: todayLabel() };
          setPresets((list) => list.map((p) => p.id === selected.id ? updated : p));
          setDraft(toDraft(updated));
        }
        setSaving(false);
        pushToast('success', isNew ? 'Preset created.' : 'Changes saved.', loadingId);
      }, 800)
    );
  };

  return {
    role,
    presets,
    visible,
    customCount,
    filter,
    setFilter,
    query,
    setQuery,
    selectedId,
    selected,
    isNew,
    draft,
    setDraft,
    editable,
    canCreate,
    canEditBuiltIns,
    dirty,
    errors,
    saving,
    select,
    startNew: () => startNew(false),
    clone,
    save,
    discard,
    pendingId,
    confirmLeave,
    cancelLeave: () => setPendingId(null),
    toasts,
    dismissToast
  };
}

export type DiseasePresetsState = ReturnType<typeof useDiseasePresets>;