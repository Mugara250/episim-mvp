import { useMemo, useState } from 'react';
import { interventionTypes } from '../data/interventions';
import { MECHANISM_LABELS } from '../data/interventions';
import { InterventionType, TypeDraft, TypeFilter } from '../types/interventions';
import { BLANK_TYPE_DRAFT, sameTypeDraft, toKey, toTypeDraft, uniqueName, validateTypeDraft } from '../utils/interventions';
import { Toasts } from './useToasts';

export const NEW_TYPE = '__new__';

interface Options {
  canEdit: boolean;
  canEditBuiltIns: boolean;
  toasts: Toasts;
  initialOpenId?: string;
  noCustom?: boolean;
}

export function useInterventionTypes({ canEdit, canEditBuiltIns, toasts, initialOpenId, noCustom }: Options) {
  const [types, setTypes] = useState<InterventionType[]>(() => noCustom ? interventionTypes.filter((t) => t.builtIn) : interventionTypes);
  const [filter, setFilter] = useState<TypeFilter>(noCustom ? 'custom' : 'all');
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(initialOpenId ?? null);
  const opened = openId && openId !== NEW_TYPE ? types.find((t) => t.id === openId) ?? null : null;
  const [draft, setDraft] = useState<TypeDraft>(opened ? toTypeDraft(opened) : BLANK_TYPE_DRAFT);
  const [saving, setSaving] = useState(false);
  const [confirmClose, setConfirmClose] = useState<null | (() => void)>(null);

  const isNew = openId === NEW_TYPE;
  const editable = canEdit && (isNew || !!opened && (!opened.builtIn || canEditBuiltIns));
  const dirty = editable && (isNew || !!opened && !sameTypeDraft(draft, toTypeDraft(opened)));
  const errors = useMemo(() => editable ? validateTypeDraft(draft, types, opened?.id ?? null) : {}, [draft, types, opened, editable]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return types.
    filter((t) => filter === 'builtin' ? t.builtIn : filter === 'custom' ? !t.builtIn : true).
    filter((t) => !q || t.name.toLowerCase().includes(q) || MECHANISM_LABELS[t.mechanism].toLowerCase().includes(q)).
    sort((a, b) => Number(b.builtIn) - Number(a.builtIn));
  }, [types, filter, query]);
  const customCount = types.filter((t) => !t.builtIn).length;

  const guard = (fn: () => void) => dirty ? setConfirmClose(() => fn) : fn();

  const openType = (id: string) =>
  guard(() => {
    const t = types.find((x) => x.id === id);
    if (!t) return;
    setOpenId(id);
    setDraft(toTypeDraft(t));
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

  const clone = (t: InterventionType) => {
    const name = uniqueName(`${t.name} (custom)`, types.map((x) => x.name));
    let key = toKey(name);
    while (types.some((x) => x.key === key)) key += '_copy';
    const copy: InterventionType = { ...t, id: `type-${Date.now()}`, name, key, builtIn: false, description: `Custom copy of ${t.name}.` };
    setTypes((list) => [...list, copy]);
    setOpenId(copy.id);
    setDraft(toTypeDraft(copy));
    setFilter((f) => f === 'builtin' ? 'all' : f);
    toasts.push('success', `Created “${copy.name}”. You can edit it now.`);
  };

  const setName = (name: string) => {
    // Keep the key in step with the name for new types until the user edits the key by hand.
    const autoKey = isNew && (draft.key === '' || draft.key === toKey(draft.name));
    setDraft({ ...draft, name, key: autoKey ? toKey(name) : draft.key });
  };

  const discard = () => {
    if (isNew) setOpenId(null);else
    if (opened) setDraft(toTypeDraft(opened));
  };

  const save = () => {
    if (!dirty || saving) return;
    const count = Object.keys(errors).length;
    if (count) {
      toasts.push('error', `Fix ${count === 1 ? 'the highlighted field' : `the ${count} highlighted fields`} before saving.`);
      return;
    }
    setSaving(true);
    const loading = toasts.push('loading', 'Saving changes…');
    toasts.later(() => {
      const values = {
        name: draft.name.trim(),
        key: draft.key.trim(),
        mechanism: draft.mechanism,
        defaultEffect: Number(draft.defaultEffect) / 100,
        source: draft.source.trim()
      };
      if (isNew) {
        const created: InterventionType = { id: `type-${Date.now()}`, description: 'Custom intervention type.', builtIn: false, placeholder: false, ...values };
        setTypes((list) => [...list, created]);
        setOpenId(created.id);
        setDraft(toTypeDraft(created));
      } else if (opened) {
        const updated = { ...opened, ...values, placeholder: false };
        setTypes((list) => list.map((t) => t.id === opened.id ? updated : t));
        setDraft(toTypeDraft(updated));
      }
      setSaving(false);
      toasts.push('success', isNew ? 'Intervention type created.' : 'Changes saved.', loading);
    }, 700);
  };

  return {
    types,
    visible,
    customCount,
    filter,
    setFilter,
    query,
    setQuery,
    openId,
    opened,
    isNew,
    draft,
    setDraft,
    setName,
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