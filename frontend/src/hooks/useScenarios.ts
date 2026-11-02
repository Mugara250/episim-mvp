import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { scenarioSeed, USER_INSTITUTIONS } from '../data/scenarioLibrary';
import { BuilderMode, LibraryTab, SaveAction, Scenario, ScenarioDraft, ScenarioShare } from '../types/scenarios';
import { accessFor, findDataset, findPreset, todayLabel } from '../utils/scenarios';
import { useToasts } from './useToasts';

export interface ScenarioScreenInit {
  scenarioTab?: LibraryTab;
  scenarioMode?: BuilderMode['kind'];
  scenarioId?: string;
  builderStep?: number;
  shareOpen?: string;
  scenarioLoading?: boolean;
  scenariosEmpty?: boolean;
  scenarioNoConfig?: boolean;
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
  /** Lets other pages (Simulations) see scenarios saved this session. */
  onSaved: (s: Scenario) => void;
}

export function useScenarios(init: ScenarioScreenInit, { onRun, onSaved }: ScenarioCallbacks) {
  const { role, userName } = useAuth();
  const toasts = useToasts();
  const isAdmin = role === 'admin';
  const institution = USER_INSTITUTIONS[role];
  const canCreate = isAdmin || role === 'analyst' || role === 'officer';

  const [scenarios, setScenarios] = useState<Scenario[]>(() => init.scenariosEmpty ? [] : scenarioSeed);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LibraryTab>(init.scenarioTab ?? (role === 'policymaker' ? 'shared' : 'mine'));
  const [query, setQuery] = useState('');
  const [diseaseFilter, setDiseaseFilter] = useState('all');
  const [datasetFilter, setDatasetFilter] = useState('all');
  const [mode, setMode] = useState<BuilderMode | null>(() => initialMode(init));
  const [shareId, setShareId] = useState<string | null>(init.shareOpen ?? null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [seq, setSeq] = useState(1047);

  useEffect(() => {
    if (init.scenarioLoading) return;
    const t = window.setTimeout(() => setLoading(false), 600);
    return () => window.clearTimeout(t);
  }, [init.scenarioLoading]);

  const access = (s: Scenario) => accessFor(s, userName, institution, isAdmin);
  const mine = useMemo(() => scenarios.filter((s) => s.owner === userName), [scenarios, userName]);
  const shared = useMemo(
    () => scenarios.filter((s) => s.owner !== userName && accessFor(s, userName, institution, isAdmin) !== null),
    [scenarios, userName, institution, isAdmin]
  );

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

  const canClone = (s: Scenario) => {
    const a = access(s);
    return !s.draft && (a === 'owner' || a === 'admin' || a === 'clone');
  };
  const canManage = (s: Scenario) => {
    const a = access(s);
    return a === 'owner' || a === 'admin';
  };

  const remove = (id: string) => {
    const s = scenarios.find((x) => x.id === id);
    setScenarios((list) => list.filter((x) => x.id !== id));
    setDeleteId(null);
    toasts.push('success', `Deleted “${s?.name ?? 'scenario'}”.`);
  };

  const setShares = (id: string, shares: ScenarioShare[]) =>
  setScenarios((list) => list.map((s) => s.id === id ? { ...s, shares } : s));

  const run = (s: Scenario) => onRun(s);

  const save = (draft: ScenarioDraft, action: SaveAction, editingId: string | null) => {
    const id = editingId ?? `SC-${seq}`;
    if (!editingId) setSeq((n) => n + 1);
    const record: Scenario = {
      id,
      name: draft.name.trim() || 'Untitled draft',
      description: draft.description.trim(),
      datasetId: draft.datasetId,
      datasetVersion: findDataset(draft.datasetId)?.version ?? null,
      presetId: draft.presetId,
      packageId: draft.packageId,
      owner: userName,
      ownerInstitution: institution,
      created: todayLabel(),
      draft: action === 'draft',
      shares:
      draft.visibility === 'institution' ?
      [{ id: `sh-${id}`, kind: 'institution', target: institution, permission: 'clone' }] :
      []
    };
    setScenarios((list) => editingId ? list.map((s) => s.id === editingId ? record : s) : [record, ...list]);
    onSaved(record);
    setMode(null);
    setTab('mine');
    if (action === 'draft') toasts.push('success', 'Draft saved. Open it from My scenarios to finish it.');else
    if (action === 'save') toasts.push('success', `Saved “${record.name}”.`);else
    run(record);
  };

  const diseaseOptions = useMemo(
    () => Array.from(new Set(source.map((s) => s.presetId).filter((x): x is string => !!x))).map((id) => findPreset(id)!).filter(Boolean),
    [source]
  );
  const datasetOptions = useMemo(
    () => Array.from(new Set(source.map((s) => s.datasetId).filter((x): x is string => !!x))).map((id) => findDataset(id)!).filter(Boolean),
    [source]
  );

  return {
    role,
    userName,
    institution,
    toasts,
    scenarios,
    loading,
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
    canRun: canCreate,
    access,
    canClone,
    canManage,
    mode,
    setMode,
    shareTarget: scenarios.find((s) => s.id === shareId) ?? null,
    openShare: setShareId,
    closeShare: () => setShareId(null),
    deleteTarget: scenarios.find((s) => s.id === deleteId) ?? null,
    askDelete: setDeleteId,
    cancelDelete: () => setDeleteId(null),
    remove,
    setShares,
    run,
    save
  };
}

export type ScenariosState = ReturnType<typeof useScenarios>;