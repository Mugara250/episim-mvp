import { useEffect, useMemo, useState } from 'react';
import { useInterventionMutations, useInterventionTypesQuery, useLevers } from '../api/interventions';
import { InterventionType, TypeDraft, TypeFilter } from '../types/interventions';
import {
  BLANK_TYPE_DRAFT,
  MECHANISM_LABELS,
  fromApiType,
  leverLabel,
  sameTypeDraft,
  toKey,
  toTypeDraft,
  validateTypeDraft } from
'../utils/interventions';
import { Toasts } from './useToasts';

export const NEW_TYPE = '__new__';

interface Options {
  canEdit: boolean;
  canEditBuiltIns: boolean;
  toasts: Toasts;
  initialOpenId?: string;
}

export function useInterventionTypes({ canEdit, canEditBuiltIns, toasts, initialOpenId }: Options) {
  const query = useInterventionTypesQuery();
  const levers = useLevers();
  const m = useInterventionMutations();
  const types: InterventionType[] = useMemo(() => (query.data ?? []).map(fromApiType), [query.data]);
  const [filter, setFilter] = useState<TypeFilter>('all');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(initialOpenId ?? null);
  const opened = openId && openId !== NEW_TYPE ? types.find((t) => t.id === openId) ?? null : null;
  const [draft, setDraft] = useState<TypeDraft>(BLANK_TYPE_DRAFT);
  const [confirmClose, setConfirmClose] = useState<null | (() => void)>(null);

  // Load the draft when a deep-linked type arrives from the server.
  useEffect(() => {
    if (opened && draft === BLANK_TYPE_DRAFT) setDraft(toTypeDraft(opened));
  }, [opened, draft]);

  const isNew = openId === NEW_TYPE;
  const editable = canEdit && (isNew || !!opened && (!opened.builtIn || canEditBuiltIns));
  const dirty = editable && (isNew || !!opened && !sameTypeDraft(draft, toTypeDraft(opened)));
  const errors = useMemo(() => editable ? validateTypeDraft(draft, types, opened?.id ?? null) : {}, [draft, types, opened, editable]);
  const saving = m.createType.isPending || m.updateType.isPending;

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return types.
    filter((t) => filter === 'builtin' ? t.builtIn : filter === 'custom' ? !t.builtIn : true).
    filter(
      (t) =>
      !q ||
      t.name.toLowerCase().includes(q) ||
      MECHANISM_LABELS[t.mechanism].toLowerCase().includes(q) ||
      leverLabel(t.engineLever).toLowerCase().includes(q)
    ).
    sort((a, b) => Number(b.builtIn) - Number(a.builtIn));
  }, [types, filter, search]);
  const customCount = types.filter((t) => !t.builtIn).length;

  const guard = (fn: () => void) => dirty ? setConfirmClose(() => fn) : fn();
  const show = (t: InterventionType) => {
    setOpenId(t.id);
    setDraft(toTypeDraft(t));
  };

  const openType = (id: string) =>
  guard(() => {
    const t = types.find((x) => x.id === id);
    if (t) show(t);
  });

  const startNew = () =>
  guard(() => {
    setOpenId(NEW_TYPE);
    setDraft({ ...BLANK_TYPE_DRAFT });
    setFilter((f) => f === 'builtin' ? 'all' : f);
  });

  const close = () => guard(() => setOpenId(null));

  const confirmDiscard = () => {
    const fn = confirmClose;
    setConfirmClose(null);
    fn?.();
  };

  const fail = (e: unknown, loading?: number) => toasts.push('error', e instanceof Error ? e.message : 'Something went wrong. Try again.', loading);

  const clone = async (t: InterventionType) => {
    const loading = toasts.push('loading', `Cloning “${t.name}”…`);
    try {
      const copy = fromApiType(await m.cloneType.mutateAsync(t.id));
      show(copy);
      setFilter((f) => f === 'builtin' ? 'all' : f);
      toasts.push('success', `Created “${copy.name}”. You can edit it now.`, loading);
    } catch (e) {
      fail(e, loading);
    }
  };

  const setName = (name: string) => {
    // Keep the key in step with the name for new types until the user edits the key by hand.
    const autoKey = isNew && (draft.key === '' || draft.key === toKey(draft.name));
    setDraft({ ...draft, name, key: autoKey ? toKey(name) : draft.key });
  };

  /** Mechanism and lever go together: only vaccination is a compartment shift. */
  const setMechanism = (mechanism: TypeDraft['mechanism']) =>
  setDraft({
    ...draft,
    mechanism,
    engineLever: mechanism === 'shift' ? 'vaccination' : draft.engineLever === 'vaccination' ? 'contact_tracing' : draft.engineLever
  });

  const discard = () => {
    if (isNew) setOpenId(null);else
    if (opened) setDraft(toTypeDraft(opened));
  };

  const save = async () => {
    if (!dirty || saving) return;
    const count = Object.keys(errors).length;
    if (count) {
      toasts.push('error', `Fix ${count === 1 ? 'the highlighted field' : `the ${count} highlighted fields`} before saving.`);
      return;
    }
    const loading = toasts.push('loading', 'Saving changes…');
    const body = {
      name: draft.name.trim(),
      key: draft.key.trim(),
      description: isNew ? 'Custom intervention type.' : opened?.description ?? '',
      mechanism: draft.mechanism,
      engineLever: draft.engineLever,
      defaultEffect: Number(draft.defaultEffect) / 100,
      source: draft.source.trim()
    };
    try {
      const saved = isNew ? await m.createType.mutateAsync(body) : await m.updateType.mutateAsync({ id: opened!.id, body });
      show(fromApiType(saved));
      toasts.push('success', isNew ? 'Intervention type created.' : 'Changes saved.', loading);
    } catch (e) {
      fail(e, loading);
    }
  };

  return {
    loading: query.isLoading,
    loadError: query.error instanceof Error ? query.error.message : null,
    types,
    levers: levers.data ?? [],
    visible,
    customCount,
    filter,
    setFilter,
    query: search,
    setQuery: setSearch,
    openId,
    opened,
    isNew,
    draft,
    setDraft,
    setName,
    setMechanism,
    editable,
    canEdit,
    canEditBuiltIns,
    dirty,
    errors,
    saving,
    openType,
    startNew,
    close,
    clone,
    save,
    discard,
    confirmPending: !!confirmClose,
    confirmDiscard,
    cancelDiscard: () => setConfirmClose(null)
  };
}

export type InterventionTypesState = ReturnType<typeof useInterventionTypes>;
