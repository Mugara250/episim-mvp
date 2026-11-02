import { useEffect, useMemo, useState } from 'react';
import { ApiCapacityProfile, useCapacityMutations, useCapacityProfilesQuery, useInstitutions, useProfileComparisons } from '../api/capacity';
import { Role } from '../lib/rbac';
import { CapacityDraft, CapacityProfile, Institution, InstitutionKind, ProfileComparison } from '../types/capacity';
import { blankCapacityDraft, parseWhole, sameCapacityDraft, toCapacityDraft, validateCapacity } from '../utils/capacity';
import { useToasts } from './useToasts';

export const NEW_PROFILE = '__new_profile__';

interface Options {
  role: Role;
  /** The signed-in user's institution; officers may only create and edit for it. */
  institutionId: string | null;
  initialId?: string;
}

const dateLabel = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

const fromApi = (p: ApiCapacityProfile): CapacityProfile => ({
  id: p.id,
  name: p.name,
  institutionId: p.institutionId,
  hospitalBeds: p.hospitalBeds,
  icuBeds: p.icuBeds ?? 0,
  ventilators: p.ventilators ?? 0,
  healthWorkers: p.healthWorkers ?? 0,
  testsPerDay: p.testsPerDay ?? 0,
  vaccineDoses: p.vaccineDoses ?? null,
  sourceNote: p.sourceNote ?? '',
  updated: dateLabel(p.updated),
  updatedBy: p.updatedBy ?? '',
  placeholder: p.placeholder,
  institutionName: p.institutionName,
  districtBeds: p.districtBeds ?? [],
  canEdit: p.canEdit
});

export function useCapacityProfiles({ role, institutionId, initialId }: Options) {
  const toasts = useToasts();
  const query = useCapacityProfilesQuery();
  const inst = useInstitutions();
  const m = useCapacityMutations();
  const profiles = useMemo(() => (query.data ?? []).map(fromApi), [query.data]);
  const institutions: Institution[] = useMemo(
    () => (inst.data ?? []).map((i) => ({ id: i.id, name: i.name, kind: i.kind as InstitutionKind })),
    [inst.data]
  );
  const comparisonMap = useProfileComparisons(profiles.map((p) => p.id));

  const [query_, setQuery] = useState('');
  const [institutionFilter, setInstitutionFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? null);
  const selected = profiles.find((p) => p.id === selectedId) ?? null;
  const [draft, setDraft] = useState<CapacityDraft>(blankCapacityDraft(''));
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const [pending, setPending] = useState<null | (() => void)>(null);

  // Open the first (or deep-linked) profile when the list arrives.
  useEffect(() => {
    if (selectedId === NEW_PROFILE || !profiles.length) return;
    const p = profiles.find((x) => x.id === selectedId) ?? (selectedId ? null : profiles[0]);
    if (p && loadedId !== p.id) {
      setSelectedId(p.id);
      setDraft(toCapacityDraft(p));
      setLoadedId(p.id);
    }
  }, [profiles, selectedId, loadedId]);

  const isAdmin = role === 'admin';
  const isOfficer = role === 'officer';
  const ownInstitution = isOfficer ? institutionId : null;
  const canCreate = isAdmin || isOfficer && !!institutionId;
  const isNew = selectedId === NEW_PROFILE;
  const canEdit = isNew ? canCreate : !!selected?.canEdit;
  const institutionLocked = !isAdmin;
  const saving = m.create.isPending || m.update.isPending;
  const dirty = canEdit && (isNew || !!selected && !sameCapacityDraft(draft, toCapacityDraft(selected)));
  const errors = useMemo(
    () => canEdit ? validateCapacity(draft, profiles, isNew ? null : selectedId) : {},
    [draft, profiles, selectedId, isNew, canEdit]
  );
  // Show errors once the user has typed in a field or tried to save.
  const visibleErrors = tried ?
  errors :
  Object.fromEntries(Object.entries(errors).filter(([k]) => (draft as unknown as Record<string, string>)[k]?.trim() !== ''));

  const usage = useMemo(() => {
    const map: Record<string, number> = {};
    Object.entries(comparisonMap).forEach(([id, list]) => map[id] = list.length);
    return map;
  }, [comparisonMap]);
  const comparisons: ProfileComparison[] =
  selected && !isNew ?
  (comparisonMap[selected.id] ?? []).map((c) => ({ id: c.id, name: c.name, runs: c.runs, date: dateLabel(c.date), profileId: c.profileId })) :
  [];

  const visible = useMemo(() => {
    const q = query_.trim().toLowerCase();
    return profiles.filter((p) => {
      const name = p.institutionName ?? '';
      return (institutionFilter === 'all' || p.institutionId === institutionFilter) && (!q || p.name.toLowerCase().includes(q) || name.toLowerCase().includes(q));
    });
  }, [profiles, query_, institutionFilter]);

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
  const show = (p: CapacityProfile) => {
    setSelectedId(p.id);
    setLoadedId(p.id);
    setDraft(toCapacityDraft(p));
    setTried(false);
  };

  const select = (id: string) => {
    if (id === selectedId) return;
    guard(() => {
      const p = profiles.find((x) => x.id === id);
      if (p) show(p);
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
      if (first) show(first);else
      {
        setSelectedId(null);
        setDraft(blankCapacityDraft(''));
      }
    } else if (selected) setDraft(toCapacityDraft(selected));
    setTried(false);
  };

  const save = async () => {
    if (!dirty || saving) return;
    setTried(true);
    const count = Object.keys(errors).length;
    if (count) {
      toasts.push('error', `Fix ${count === 1 ? 'the highlighted field' : `the ${count} highlighted fields`} before saving.`);
      return;
    }
    const loading = toasts.push('loading', 'Saving capacity profile…');
    const body = {
      name: draft.name.trim(),
      institutionId: draft.institutionId,
      hospitalBeds: parseWhole(draft.hospitalBeds),
      icuBeds: parseWhole(draft.icuBeds),
      ventilators: parseWhole(draft.ventilators),
      healthWorkers: parseWhole(draft.healthWorkers),
      testsPerDay: parseWhole(draft.testsPerDay),
      vaccineDoses: draft.vaccineDoses.trim() ? parseWhole(draft.vaccineDoses) : null,
      sourceNote: draft.sourceNote.trim(),
      // Per-district beds are not edited on this screen; keep what the profile already has.
      districtBeds: isNew ? [] : selected?.districtBeds ?? []
    };
    try {
      const saved = fromApi(isNew ? await m.create.mutateAsync(body) : await m.update.mutateAsync({ id: selected!.id, body }));
      show(saved);
      const n = comparisons.length;
      toasts.push(
        'success',
        isNew ? 'Capacity profile created.' : n ? `Saved. ${n} comparison${n === 1 ? '' : 's'} will use the new numbers.` : 'Changes saved.',
        loading
      );
    } catch (e) {
      toasts.push('error', e instanceof Error ? e.message : 'The profile couldn’t be saved.', loading);
    }
  };

  return {
    toasts,
    loading: query.isLoading,
    loadError: query.error instanceof Error ? query.error.message : null,
    profiles,
    institutions,
    visible,
    query: query_,
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
