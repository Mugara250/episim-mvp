import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useScenarioList, useScenarioMutations, useScenarioRefs } from '../api/scenarios';
import { errorMessage } from '../api/http';
import { getAccessLevel } from '../lib/rbac';
import { Access, BuilderMode, LibraryTab, SaveAction, Scenario, ScenarioDraft, SharePermission } from '../types/scenarios';
import { useToasts } from './useToasts';

export interface ScenarioScreenInit {
  scenarioTab?: LibraryTab;
  scenarioMode?: BuilderMode['kind'];
  scenarioId?: string;
  builderStep?: number;
}

function initialMode(init: ScenarioScreenInit): BuilderMode | null {
  if (!init.scenarioMode) return null;
  if (init.scenarioMode === 'new') return { kind: 'new' };
  if (!init.scenarioId) return null;
  return init.scenarioMode === 'clone' ?
  { kind: 'clone', fromId: init.scenarioId } :
  { kind: init.scenarioMode, id: init.scenarioId };
}

interface ScenarioCallbacks {
  /** Opens the Simulations page with this scenario selected. */
  onRun: (s: Scenario) => void;
}

const message = (e: unknown) => e instanceof Error ? e.message : errorMessage(e, 'Something went wrong. Try again.');

export function useScenarios(init: ScenarioScreenInit, { onRun }: ScenarioCallbacks) {
  const { role, user, userName } = useAuth();
  const toasts = useToasts();
  const list = useScenarioList();
  const refs = useScenarioRefs();
  const m = useScenarioMutations();
  const isAdmin = role === 'admin';
  const institution = user?.institutionName ?? '';
  const level = getAccessLevel(role, 'scenarios');
  const canCreate = isAdmin || role === 'analyst' || role === 'officer';
  const canRun = ['full', 'write'].includes(getAccessLevel(role, 'simulation'));

  const scenarios = useMemo(() => list.data ?? [], [list.data]);
  const [tab, setTab] = useState<LibraryTab>(init.scenarioTab ?? (role === 'policymaker' ? 'shared' : 'mine'));
  const [query, setQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [datasetFilter, setDatasetFilter] = useState('all');
  const [mode, setMode] = useState<BuilderMode | null>(() => initialMode(init));
  const [shareId, setShareId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const access = (s: Scenario) => (s.access ?? null) as Access | null;
  const mine = useMemo(() => scenarios.filter((s) => s.ownerId === user?.id), [scenarios, user?.id]);
  const shared = useMemo(() => scenarios.filter((s) => s.ownerId !== user?.id && s.access !== null), [scenarios, user?.id]);

  const source = tab === 'mine' ? mine : shared;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return source.filter(
      (s) =>
      (diseaseFilter === 'all' || s.presetId === diseaseFilter) && (
      datasetFilter === 'all' || s.datasetId === datasetFilter) && (
      !q || s.name.toLowerCase().includes(q) || s.owner.toLowerCase().includes(q))
    );
  }, [source, query, diseaseFilter, datasetFilter]);
  const filtersActive = !!query.trim() || diseaseFilter !== 'all' || datasetFilter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setDiseaseFilter('all');
    setDatasetFilter('all');
  };

  // Policy makers ("review") may clone scenarios shared with clone permission.
  const canClone = (s: Scenario) => {
    const a = access(s);
    return level !== 'none' && !s.draft && (a === 'owner' || a === 'admin' || a === 'clone');
  };
  const canManage = (s: Scenario) => {
    const a = access(s);
    return a === 'owner' || a === 'admin';
  };

  const remove = (id: string) => {
    const s = scenarios.find((x) => x.id === id);
    m.remove.mutate(id, {
      onSuccess: () => toasts.push('success', `Deleted “${s?.name ?? 'scenario'}”.`),
      onError: (e) => toasts.push('error', message(e)),
      onSettled: () => setDeleteId(null)
    });
  };

  const setShares = (id: string, shares: {kind: 'user' | 'institution';targetId: string;permission: SharePermission;}[], done?: (text: string) => void, text?: string) =>
  m.setShares.mutate(
    { id, shares },
    {
      onSuccess: () => done && text && done(text),
      onError: (e) => toasts.push('error', message(e))
    }
  );

  const run = (s: Scenario) => onRun(s);

  /** Saves the builder's draft. Resolves to true on success so the builder can stop its spinner. */
  const save = async (draft: ScenarioDraft, action: SaveAction, editing: BuilderMode): Promise<boolean> => {
    const asDraft = action === 'draft';
    try {
      const record =
      editing.kind === 'draft' ?
      await m.update.mutateAsync({ id: editing.id, draft, asDraft }) :
      editing.kind === 'clone' ?
      await m.cloneAndSave.mutateAsync({ fromId: editing.fromId, draft, asDraft }) :
      await m.create.mutateAsync({ draft, asDraft });
      setMode(null);
      setTab('mine');
      if (action === 'draft') toasts.push('success', 'Draft saved. Open it from My scenarios to finish it.');else
      if (action === 'save') toasts.push('success', `Saved “${record.name}”.`);else
      run(record);
      return true;
    } catch (e) {
      toasts.push('error', message(e));
      return false;
    }
  };

  const diseaseOptions = useMemo(() => {
    const ids = new Set(source.map((s) => s.presetId).filter((x): x is string => !!x));
    return Array.from(ids).map((id) => {
      const s = source.find((x) => x.presetId === id)!;
      return { id, name: s.presetName ?? id };
    });
  }, [source]);
  const datasetOptions = useMemo(() => {
    const ids = new Set(source.map((s) => s.datasetId).filter((x): x is string => !!x));
    return Array.from(ids).map((id) => {
      const s = source.find((x) => x.datasetId === id)!;
      return { id, name: s.datasetName ?? id };
    });
  }, [source]);

  return {
    role,
    userId: user?.id ?? '',
    userName,
    institution,
    toasts,
    refs,
    scenarios,
    loading: list.isLoading,
    error: list.error,
    retry: () => list.refetch(),
    tab,
    setTab,
    query,
    setQuery,
    diseaseFilter,
    setDiseaseFilter,
    datasetFilter,
    setDatasetFilter,
    filtersActive,
    clearFilters,
    mine,
    shared,
    rows: filtered,
    diseaseOptions,
    datasetOptions,
    canCreate,
    canRun,
    access,
    canClone,
    canManage,
    mode,
    setMode,
    shareTarget: scenarios.find((s) => s.id === shareId) ?? null,
    openShare: setShareId,
    closeShare: () => setShareId(null),
    deleteTarget: scenarios.find((s) => s.id === deleteId) ?? null,
    deleting: m.remove.isPending,
    askDelete: setDeleteId,
    cancelDelete: () => setDeleteId(null),
    remove,
    setShares,
    run,
    save
  };
}

export type ScenariosState = ReturnType<typeof useScenarios>;
