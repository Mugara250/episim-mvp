import { useEffect, useMemo, useState } from 'react';
import { capacityProfiles, institutions, OFFICER_INSTITUTION_ID, profileComparisons } from '../data/capacityProfiles';
import { Role } from '../lib/rbac';
import { CapacityDraft, CapacityProfile } from '../types/capacity';
import { blankCapacityDraft, parseWhole, sameCapacityDraft, toCapacityDraft, todayLabel, validateCapacity } from '../utils/capacity';
import { useToasts } from './useToasts';

export const NEW_PROFILE = '__new_profile__';

interface Options {
  role: Role;
  userName: string;
  initialId?: string;
  empty?: boolean;
}

export function useCapacityProfiles({ role, userName, initialId, empty }: Options) {
  const toasts = useToasts();
  const [profiles, setProfiles] = useState<CapacityProfile[]>(() => empty ? [] : capacityProfiles);
  const [query, setQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(empty ? null : initialId ?? capacityProfiles[0].id);
  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const [draft, setDraft] = useState<CapacityDraft>(selected ? toCapacityDraft(selected) : blankCapacityDraft(''));
  const [tried, setTried] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pending, setPending] = useState<null | (() => void)>(null);

  const isAdmin = role === 'admin';
  const isOfficer = role === 'officer';
  const ownInstitution = isOfficer ? OFFICER_INSTITUTION_ID : null;
  const canCreate = isAdmin || isOfficer;
  const isNew = selectedId === NEW_PROFILE;
  const canEdit = isAdmin || isOfficer && (isNew || selected?.institutionId === ownInstitution);
  const institutionLocked = !isAdmin;

  const dirty = canEdit && (isNew || !!selected && !sameCapacityDraft(draft, toCapacityDraft(selected)));
  const errors = useMemo(() => canEdit ? validateCapacity(draft, profiles, isNew ? null : selectedId) : {}, [draft, profiles, selectedId, isNew, canEdit]);
  // Show errors once the user has typed in a field or tried to save.
  const visibleErrors = tried ? errors : Object.fromEntries(Object.entries(errors).filter(([k]) => (draft as Record<string, string>)[k]?.trim() !== ''));

  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    profileComparisons.forEach((c) => map[c.profileId] = (map[c.profileId] ?? 0) + 1);
    return map;
  }, []);
  const comparisons = selected && !isNew ? profileComparisons.filter((c) => c.profileId === selected.id) : [];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return profiles.filter((p) => {
      const inst = institutions.find((i) => i.id === p.institutionId)?.name ?? '';
      return (institutionFilter === 'all' || p.institutionId === institutionFilter) && (!q || p.name.toLowerCase().includes(q) || inst.toLowerCase().includes(q));
    });
  }, [profiles, query, institutionFilter]);

  // Warn before closing or reloading the tab with unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  const guard = (fn: () => void) => dirty ? setPending(() => fn) : fn();

  const select = (id: string) => {
    if (id === selectedId) return;
    guard(() => {
      const p = profiles.find((x) => x.id === id);
      if (!p) return;
      setSelectedId(id);
      setDraft(toCapacityDraft(p));
      setTried(false);
    });
  };

  const startNew = () =>
  guard(() => {
    setSelectedId(NEW_PROFILE);
    setDraft(blankCapacityDraft(ownInstitution ?? ''));
    setTried(false);
  });

  const discard = () => {
    if (isNew) {
      const first = profiles[0];
      setSelectedId(first?.id ?? null);
      setDraft(first ? toCapacityDraft(first) : blankCapacityDraft(''));
    } else if (selected) setDraft(toCapacityDraft(selected));
    setTried(false);
  };

  const save = () => {
    if (!dirty || saving) return;
    setTried(true);
    const count = Object.keys(errors).length;
    if (count) {
      toasts.push('error', `Fix ${count === 1 ? 'the highlighted field' : `the ${count} highlighted fields`} before saving.`);
      return;
    }
    setSaving(true);
    const loading = toasts.push('loading', 'Saving capacity profile…');
    toasts.later(() => {
      const values = {
        name: draft.name.trim(),
        institutionId: draft.institutionId,
        hospitalBeds: parseWhole(draft.hospitalBeds),
        icuBeds: parseWhole(draft.icuBeds),
        ventilators: parseWhole(draft.ventilators),
        healthWorkers: parseWhole(draft.healthWorkers),
        testsPerDay: parseWhole(draft.testsPerDay),
        vaccineDoses: draft.vaccineDoses.trim() ? parseWhole(draft.vaccineDoses) : null,
        sourceNote: draft.sourceNote.trim(),
        updated: todayLabel(),
        updatedBy: userName,
        placeholder: false
      };
      if (isNew) {
        const created: CapacityProfile = { id: `cap-${Date.now()}`, ...values };
        setProfiles((list) => [created, ...list]);
        setSelectedId(created.id);
        setDraft(toCapacityDraft(created));
      } else if (selected) {
        const updated = { ...selected, ...values };
        setProfiles((list) => list.map((p) => p.id === selected.id ? updated : p));
        setDraft(toCapacityDraft(updated));
      }
      setSaving(false);
      setTried(false);
      const n = comparisons.length;
      toasts.push(
        'success',
        isNew ? 'Capacity profile created.' : n ? `Saved. ${n} comparison${n === 1 ? '' : 's'} will use the new numbers.` : 'Changes saved.',
        loading
      );
    }, 700);
  };

  return {
    toasts,
    profiles,
    visible,
    query,
    setQuery,
    institutionFilter,
    setInstitutionFilter,
    selectedId,
    selected,
    isNew,
    draft,
    setDraft,
    errors: visibleErrors,
    dirty,
    saving,
    canCreate,
    canEdit,
    institutionLocked,
    ownInstitution,
    usage,
    comparisons,
    select,
    startNew,
    save,
    discard,
    confirmPending: !!pending,
    confirmDiscard: () => {
      const fn = pending;
      setPending(null);
      fn?.();
    },
    cancelDiscard: () => setPending(null)
  };
}

export type CapacityState = ReturnType<typeof useCapacityProfiles>;